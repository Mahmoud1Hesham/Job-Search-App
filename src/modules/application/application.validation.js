import joi from 'joi';
import { generalFields } from '../../middleware/validation.middleware.js';

export const createApplication = joi.object({
    jobId: generalFields.id.required(),

    status: joi.string()
        .valid("pending", "accepted", "viewed", "in consideration", "rejected")
        .optional()
}).required();
export const getAllApplications = joi.object({
    jobId: generalFields.id.required(), 
}).required();
export const acceptRefuseApplication = joi.object({
    applicationId: generalFields.id.required(),
    status: joi.string().valid("accepted", "rejected")
}).required();
