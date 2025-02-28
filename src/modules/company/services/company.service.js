import { asyncHandler } from "../../../utils/response/error.response.js";
import * as dbService from '../../../DB/db.service.js';
import { companyModel } from "../../../DB/models/Company.model.js";
import { successResponse } from "../../../utils/response/success.response.js";
import cloud from '../../../utils/multer/cloudnary.js'
import { roleTypes, userModel } from "../../../DB/models/User.model.js";

export const addCompany = asyncHandler(async (req, res, next) => {
    const data = req.body;
    console.log(data.companyEmail)
        if (!data.companyEmail) {
            return next(new Error("Company email is required!", { cause: 400 }));
        }
        
    const existingCompany = await dbService.findOne({
        model: companyModel,
        filter: {
            companyEmail:data.companyEmail,
            deletedAt: { $exists: false }
        }
    });
    console.log(existingCompany)
    if (existingCompany) {
        return next(new Error("Company name or email already exists!", { cause: 400 }));
    }

    const company = await dbService.create({
        model: companyModel,
        data: { companyName:data.companyName,
            companyEmail:data.companyEmail,
            industry:data.industry,description:data.description, owner: req.user._id }
    });

    successResponse({ res, message: "Company created successfully!", data: company });
});


export const updateCompany = asyncHandler(async (req, res, next) => {
    const { companyId } = req.params;

    const company = await dbService.findOne({
        model: companyModel,
        filter: { _id: companyId, deletedAt: { $exists: false } }
    });

    if (!company) {
        return next(new Error("Company not found or has been deleted!", { cause: 404 }));
    }

    if (company.owner.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized to update this company!", { cause: 403 }));
    }

    const { legalAttachment, ...updateData } = req.body;

    const updatedCompany = await dbService.findOneAndUpdate({
        model: companyModel,
        filter: { _id: companyId },
        data: updateData,
        options: { new: true }
    });

    successResponse({ res, message: "Company updated successfully!", data: updatedCompany });
});


export const freezeCompany = asyncHandler(async (req, res, next) => {
    const { companyId } = req.params;

    const company = await dbService.findOne({
        model: companyModel,
        filter: { _id: companyId, deletedAt: { $exists: false } } 
    });

    if (!company) {
        return next(new Error("Company not found or already deleted!", { cause: 404 }));
    }

    if (company.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        return next(new Error("Unauthorized to delete this company!", { cause: 403 }));
    }

    await dbService.findOneAndUpdate({
        model: companyModel,
        filter: { _id: companyId },
        data: { deletedAt: new Date() }
    });

    successResponse({ res, message: "Company deleted successfully!" });
});


export const restoreCompany = asyncHandler(async (req, res, next) => {
    const { companyId } = req.params;

    const company = await dbService.findOne({
        model: companyModel,
        filter: { _id: companyId, deletedAt: { $exists: true } } 
    });

    if (!company) {
        return next(new Error("Company not found or not deleted!", { cause: 404 }));
    }

    if (company.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        return next(new Error("Unauthorized to restore this company!", { cause: 403 }));
    }

    await dbService.findOneAndUpdate({
        model: companyModel,
        filter: { _id: companyId },
        data: { $unset: { deletedAt: 1 } }
    });

    successResponse({ res, message: "Company restored successfully!" });
});


export const searchCompanyByName = asyncHandler(async (req, res, next) => {
    const { name } = req.params;

    if (!name) {
        return next(new Error("Company name is required!", { cause: 400 }));
    }

    const company = await dbService.findOne({
        model: companyModel,
        filter: {
            companyName: { $regex: new RegExp(`^${name}$`, "i") }, 
            deletedAt: { $exists: false }
        }
    });

    if (!company) {
        return next(new Error("Company not found!", { cause: 404 }));
    }

    successResponse({ res, message: "Company found!", data: company });
});


export const uploadCompanyLogo = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new Error("Logo image is required!", { cause: 400 }));
    }

    const { secure_url, public_id } = await cloud.uploader.upload(req.file.path, {
        folder: `company/${req.user._id}/logo`
    });

    const company = await dbService.findOneAndUpdate({
        model: companyModel,
        filter: { owner: req.user._id, deletedAt: { $exists: false } },
        data: { logo: { secure_url, public_id } },
        options: { new: true }
    });

    if (!company) {
        return next(new Error("Company not found or deleted!", { cause: 404 }));
    }

    successResponse({ res, message: "Company logo uploaded successfully!", data: company });
});

export const uploadCompanyCoverImages = asyncHandler(async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next(new Error("No files uploaded!", { cause: 400 }));
    }

    const company = await dbService.findOne({
        model: companyModel,
        filter: { owner: req.user._id }
    });

    if (!company) {
        return next(new Error("Company not found for this user!", { cause: 404 }));
    }

    const images = [];
    for (const file of req.files) {
        const { secure_url, public_id } = await cloud.uploader.upload(file.path, {
            folder: `company/${req.user._id}/cover`
        });
        images.push({ secure_url, public_id });
    }

    const updatedCompany = await dbService.findByIdAndUpdate({
        model: companyModel,
        id: company._id,
        data: { coverPics: images },
        options: { new: true }
    });

    successResponse({ res, data: { files: req.files, company: updatedCompany } });
});


export const deleteCompanyLogo = asyncHandler(async (req, res, next) => {
    const company = await dbService.findOne({
        model: companyModel,
        filter: { owner: req.user._id, deletedAt: { $exists: false } }
    });

    if (!company) {
        return next(new Error("Company not found or deleted!", { cause: 404 }));
    }

    if (!company.logo?.public_id) {
        return next(new Error("No logo to delete!", { cause: 400 }));
    }

    await cloud.uploader.destroy(company.logo.public_id);

    await dbService.findOneAndUpdate({
        model: companyModel,
        filter: { owner: req.user._id },
        data: { $unset: { logo: "" } }
    });

    successResponse({ res, message: "Company logo deleted successfully!" });
});


export const deleteCompanyCover = asyncHandler(async (req, res, next) => {
    const company = await dbService.findOne({
        model: companyModel,
        filter: { owner: req.user._id }
    });

    if (!company) {
        return next(new Error("Company not found for this user!", { cause: 404 }));
    }

    if (!company.coverPics || company.coverPics.length === 0) {
        return next(new Error("No cover images found to delete!", { cause: 400 }));
    }

    await Promise.all(company.coverPics.map(pic => cloud.uploader.destroy(pic.public_id)));

    await dbService.findByIdAndUpdate({
        model: companyModel,
        id: company._id,
        data: { $unset: { coverPics: "" } },
        options: { new: true }
    });

    successResponse({
        res,
        message: "All cover images deleted successfully!"
    });
});

export const assignHRsToCompany = asyncHandler(async (req, res, next) => {
    const { companyId } = req.params;
    const { HRs } = req.body; // Array of User IDs

    const company = await dbService.findOne({
        model: companyModel,
        filter: { _id: companyId, owner: req.user._id }
    });

    if (!company) {
        return next(new Error("You are not authorized to update this company!", { cause: 403 }));
    }

    const users = await dbService.findAll({
        model: userModel,
        filter: { _id: { $in: HRs } }
    });

    if (users.length !== HRs.length) {
        return next(new Error("One or more users do not exist!", { cause: 400 }));
    }

    await dbService.updateMany({
        model: userModel,
        filter: { _id: { $in: HRs } },
        data: { role: roleTypes.HR }
    });

    const updatedCompany = await dbService.findByIdAndUpdate({
        model: companyModel,
        id: company._id,
        data: { $addToSet: { HRs: { $each: HRs } } },
        options: { new: true }
    });

    successResponse({ res, message: "HRs assigned successfully!", data: updatedCompany });
});


export const getCompanyWithJobs = asyncHandler(async (req, res, next) => {
    const { companyId } = req.params;

    const company = await companyModel.findById(companyId)
        .populate({
            path: "jobs",
            select: "jobTitle jobLocation workingTime seniorityLevel"
        });

    if (!company) {
        return next(new Error("Company not found", { cause: 404 }));
    }

    successResponse({ res, data: { company } });
});

