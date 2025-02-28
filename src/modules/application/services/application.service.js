import { applicationModel } from "../../../DB/models/Application.model.js";
import { asyncHandler } from "../../../utils/response/error.response.js";
import * as dbService from '../../../DB/db.service.js';
import { jobModel } from "../../../DB/models/Job.model.js";
import cloud from '../../../utils/multer/cloudnary.js';
import { successResponse } from "../../../utils/response/success.response.js";
import { companyModel } from "../../../DB/models/Company.model.js";
import { userModel } from "../../../DB/models/User.model.js";
import { sendEmail } from "../../../utils/email/send.email.js";
import { paginate } from "../../../utils/pagination/pagination.js";

export const applyToJob = asyncHandler(async (req, res, next) => {
    const { jobId } = req.params;

    if (!req.file) {
        return next(new Error("CV file is required!", { cause: 400 }));
    }

    const job = await dbService.findOne({
        model: jobModel,
        filter: { _id: jobId }
    });

    if (!job) {
        throw new Error("Job not found!");
    }

    const existingApplication = await dbService.findOne({
        model: applicationModel,
        filter: { jobId: jobId, userId: req.user._id }
    });

    if (existingApplication) {
        throw new Error("You have already applied to this job!");
    }

    const { secure_url, public_id } = await cloud.uploader.upload(req.file.path, {
        folder: `application/${req.user._id}`
    });

    const applicationData = {
        ...req.body,
        userCV: { secure_url, public_id }
    };

    const application = await dbService.create({
        model: applicationModel,
        data: {
            ...applicationData,
            jobId: jobId,
            userId: req.user._id
        }
    });
    const companyHRs = await userModel.find({ _id: { $in: job.companyId.HRs } });

    companyHRs.forEach(hr => {
        io.to(hr._id.toString()).emit("newApplication", {
            message: `New application for ${job.jobTitle}`,
            jobId,
            userId
        });
    });

    successResponse({
        res,
        message: "Application submitted successfully!",
    });
});

export const acceptRefuseApplication = asyncHandler(async (req, res, next) => {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
        return next(new Error("Invalid status provided. Must be 'accepted' or 'rejected'.", { cause: 400 }));
    }

    const application = await dbService.findOne({
        model: applicationModel,
        filter: { _id: applicationId }
    });
    if (!application) {
        return next(new Error("Application not found!", { cause: 404 }));
    }

    const job = await dbService.findOne({
        model: jobModel,
        filter: { _id: application.jobId }
    });
    if (!job) {
        return next(new Error("Job not found for this application!", { cause: 404 }));
    }

    const company = await dbService.findOne({
        model: companyModel,
        filter: { _id: job.companyId }
    });
    if (!company) {
        return next(new Error("Company not found for this job!", { cause: 404 }));
    }

    const hrIds = company.HRs.map(id => id.toString());
    if (!hrIds.includes(req.user._id.toString())) {
        return next(new Error("Unauthorized: Only a company HR can update this application!", { cause: 403 }));
    }

    const updatedApplication = await dbService.findOneAndUpdate({
        model: applicationModel,
        filter: { _id: applicationId },
        data: { status },
        options: { new: true }
    });

    const applicant = await dbService.findOne({
        model: userModel,
        filter: { _id: application.userId },
        select: "email"
    });
    if (applicant && applicant.email) {
        let subject, text;
        if (status === "accepted") {
            subject = "Your job application has been accepted";
            text = `Congratulations! Your application for the job "${job.jobTitle}" at "${company.companyName}" has been accepted.`;
        } else {
            subject = "Your job application has been rejected";
            text = `We regret to inform you that your application for the job "${job.jobTitle}" at "${company.companyName}" has been rejected.`;
        }
        await sendEmail({
            to: applicant.email,
            subject,
            text
        });
    } else {
        console.error("Applicant email not found.");
    }

    successResponse({
        res,
        message: "Application status updated successfully! and an email was sent to the applicant",
        data: updatedApplication
    });
});

export const getApplicationsForJob = asyncHandler(async (req, res, next) => {
    const { jobId } = req.params;

    const job = await dbService.findOne({
        model: jobModel,
        filter: { _id: jobId }
    });
    if (!job) {
        return next(new Error("Job not found!", { cause: 404 }));
    }

    const company = await dbService.findOne({
        model: companyModel,
        filter: { _id: job.companyId }
    });
    if (!company) {
        return next(new Error("Company not found for this job!", { cause: 404 }));
    }

    const ownerId = company.owner ? company.owner.toString() : "";
    const hrIds = company.HRs ? company.HRs.map(id => id.toString()) : [];
    if (req.user._id.toString() !== ownerId && !hrIds.includes(req.user._id.toString())) {
        return next(new Error("Unauthorized: Only company owner or HR can view applications", { cause: 403 }));
    }

    const filter = { jobId };

    const jobsPage = await paginate({
        model: applicationModel,
        filter,
        populate: [{ path: "applicant", select: "firstName lastName email" }],
        page: req.query.page,
        size: req.query.size,
        sort: { createdAt: -1 }
    });

    successResponse({
        res,
        message: "Applications retrieved successfully",
        data: jobsPage
    });
});