import joi from 'joi';
import { Types } from 'mongoose';
import { genderTypes } from '../DB/models/User.model.js';

const checkObjectId = (value, helper) => {
    return Types.ObjectId.isValid(value) ? true : helper.message("invalid object id !");
}

const fileObject = {
    fieldname: joi.string(),
    originalname: joi.string(),
    encoding: joi.string(),
    mimetype: joi.string(),
    destination: joi.string(),
    filename: joi.string(),
    path: joi.string(),
    size: joi.number()
}


export const generalFields = {
    // userName: joi.string().min(2).max(25).trim(),
    firstName: joi.string().min(2).max(25).trim(),
    lastName: joi.string().min(2).max(25).trim(),
    email: joi.string().email({ tlds: { allow: ["com", "net", "eg", "edu", "gov"] }, minDomainSegments: 2, maxDomainSegments: 3 }),
    password: joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)),
    confirmationPassword: joi.string(),
    code: joi.string().pattern(new RegExp(/^\d{4}$/)),
    id: joi.string().custom(checkObjectId),
    DOB: joi.date().less("now"),
    phone: joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)),
    gender: joi.string().valid(...Object.values(genderTypes)),
    fileObject,
    file:joi.object(fileObject)
}

export const validation = (schema) => {
    return (req, res, next) => {
        const inputData = { ...req.body, ...req.params, ...req.query };
        if (req.file || req.files?.length) {
            inputData.file = req.file || req.files 
        }
        const validationResult = schema.validate(inputData, { abortEarly: false })
        if (validationResult.error) {
            return res.status(400).json({ message: 'validation error', details: validationResult.error.details })
        }
        return next();
    }
}
