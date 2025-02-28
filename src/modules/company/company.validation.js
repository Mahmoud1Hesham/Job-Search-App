import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";

export const addCompany = joi.object({
    companyName: joi.string().min(3).max(100).required(),
    companyEmail: generalFields.email,
    industry: joi.string(),
    description: joi.string()
}).required();

export const updateCompany = joi.object({
    companyId: generalFields.id.required(),
    companyName: joi.string().min(3).max(100),
    companyEmail: generalFields.email,
    industry: joi.string(),
    description: joi.string()
}).required();

export const freezeCompany = joi.object({
    companyId: generalFields.id.required(),
}).required();

export const restoreCompany = joi.object({
    companyId: generalFields.id.required(),
}).required();
export const assignHRsToCompany = joi.object({
    companyId: generalFields.id.required(),
    HRs: joi.array().items(generalFields.id).min(1).required()
}).required();

export const searchByName = joi.object({
    name:joi.string().required(),
}).required();

export const getCompanyWithJobsValidation = joi.object({
    companyId: generalFields.id.required()
}).required();