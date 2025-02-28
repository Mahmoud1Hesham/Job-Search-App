import { companyModel } from "../../../DB/models/Company.model.js";
import { asyncHandler } from "../../../utils/response/error.response.js";
import * as dbService from '../../../DB/db.service.js'
import { jobModel } from "../../../DB/models/Job.model.js";
import { successResponse } from "../../../utils/response/success.response.js";
import { paginate } from "../../../utils/pagination/pagination.js";

export const addJob = asyncHandler(async (req, res, next) => {
    const company = await dbService.findOne({
        model: companyModel,
        filter: {
            $or: [{ owner: req.user._id }, { HRs: req.user._id }]
        }
    });

    if (!company) {
        return next(new Error("You are not authorized to add a job!", { cause: 403 }));
    }

    const job = await dbService.create({
        model: jobModel,
        data: {
            ...req.body,
            company: company._id, 
            createdBy: req.user._id
        }
    });

    successResponse({ res, message: "Job added successfully!", data: job });
});


export const updateJob = asyncHandler(async (req, res, next) => {
    const job = await dbService.findOne({
        model: jobModel,
        filter: { _id: req.params.jobId }
    });

    if (!job) {
        return next(new Error("Job not found!", { cause: 404 }));
    }

    const company = await dbService.findOne({
        model: companyModel,
        filter: { _id: job.companyId }
    });

    if (!company || company.owner.toString() !== req.user._id.toString()) {
        return next(new Error("Only the company owner can update this job!", { cause: 403 }));
    }

    const updatedJob = await dbService.findByIdAndUpdate({
        model: jobModel,
        id: job._id,
        data: req.body,
        options: { new: true }
    });

    successResponse({ res, message: "Job updated successfully!", data: updatedJob });
});

export const deleteJob = asyncHandler(async (req, res, next) => {
    const job = await dbService.findOne({
        model: jobModel,
        filter: { _id: req.params.jobId }
    });
console.log(job)
    if (!job) {
        return next(new Error("Job not found!", { cause: 404 }));
    }

    const company = await dbService.findOne({
        model: companyModel,
        filter: { _id: job.companyId }
    });

    if (!company || !company.HRs.includes(req.user._id.toString())) {
        return next(new Error("Only a company HR can delete this job!", { cause: 403 }));
    }

    await dbService.deleteOne({
        model: jobModel,
        id: job._id
    });

    successResponse({ res, message: "Job deleted successfully!" });
});

export const getJobs = asyncHandler(async (req, res, next) => {
    const { companyId } = req.params;
    const { page, size, search } = req.query;

    let filter = {};
    
    if (search) {
        const company = await companyModel.findOne(
            { companyName: new RegExp(search, "i") },
            "_id"
        );
        if (company) filter.companyId = company._id;
        else return successResponse({ res, data: { count: 0, result: [] } }); 
    }

    if (companyId) filter.companyId = companyId;

    const jobs = await paginate({
        model: jobModel,
        filter,
        populate: [{ path: "companyId", select: "companyName" }],
        select: "-updatedBy",
        page,
        size
    });

    successResponse({ res, data: jobs });
});



export const filterJobs = async (req, res, next) => {
    console.log(" getJobs Function Called"); 
    try {
        const { workingTime, jobLocation, seniorityLevel, jobTitle, technicalSkills, companyId } = req.query;

        let filter = {};

        if (companyId) filter.companyId = companyId;
        if (workingTime) filter.workingTime = workingTime;
        if (jobLocation) filter.jobLocation = jobLocation;
        if (seniorityLevel) filter.seniorityLevel = seniorityLevel;
        if (jobTitle) filter.jobTitle = { $regex: jobTitle, $options: "i" }; 

        if (technicalSkills) {
            const skillsArray = Array.isArray(technicalSkills) ? technicalSkills : [technicalSkills];
            filter.technicalSkills = { $in: skillsArray };
        }

        console.log(" Applied Filter:", filter); 

        const jobs = await paginate({
            model: jobModel,
            filter,
            populate: [{ path: "companyId", select: "companyName" }],
            select: "-__v",
            page: req.query.page,
            size: req.query.size
        });

        res.status(200).json({ message: "Done", data: jobs });
    } catch (error) {
        console.error(" Error in getJobs:", error);
        next(error);ا
    }
};

