import joi from 'joi';
import { generalFields } from '../../middleware/validation.middleware.js'


export const signup = joi.object().keys({
    // userName: generalFields.userName.required(),
    firstName: generalFields.firstName.required(),
    lastName: generalFields.lastName.required(),
    email: generalFields.email.required(),
    password: generalFields.password.required(),
    confirmationPassword: generalFields.confirmationPassword.valid(joi.ref('password')).required(),
    phone:generalFields.phone.required(),
    gender:generalFields.gender.required(),
    DOB:generalFields.DOB.required(),
}).required()

export const login = joi.object().keys({
    email: generalFields.email.required(),
    password: generalFields.password.required(),
}).required()

export const forgetPassword = joi.object().keys({
    email: generalFields.email.required(),
}).required()

export const confirmEmail = joi.object().keys({
    code: generalFields.code.required(),
    email: generalFields.email.required(),
}).required()

export const resetPassword = joi.object().keys({
    code: generalFields.code.required(),
    email: generalFields.email.required(),
    password: generalFields.password.required(),
}).required()