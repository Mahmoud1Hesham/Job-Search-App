import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";
import { jobLocationTypes, workingTimeTypes, seniorityLevelTypes } from "../../DB/models/Job.model.js";

export const createJob = joi.object({
    jobTitle: joi.string().min(3).max(100).required(),
    jobLocation: joi.string().valid(...Object.values(jobLocationTypes)).required(),
    workingTime: joi.string().valid(...Object.values(workingTimeTypes)).required(),
    seniorityLevel: joi.string().valid(...Object.values(seniorityLevelTypes)).required(),
    
    jobDescription: joi.string().min(10).max(1000).required(),
    technicalSkills: joi.array().items(joi.string()).min(1).required(),
    softSkills: joi.array().items(joi.string()).min(1),
    companyId: generalFields.id.required(),
}).required();


export const updateJob = joi.object({
    jobTitle: joi.string().min(3).max(100),
    jobLocation: joi.string().valid(...Object.values(jobLocationTypes)),
    workingTime: joi.string().valid(...Object.values(workingTimeTypes)),
    seniorityLevel: joi.string().valid(...Object.values(seniorityLevelTypes)),
    
    jobDescription: joi.string().min(10).max(1000),
    technicalSkills: joi.array().items(joi.string()).min(1),
    softSkills: joi.array().items(joi.string()).min(1),
    jobId: generalFields.id.required(),
}).required();

export const deleteJob = joi.object({
    jobId: generalFields.id.required(),
}).required();
