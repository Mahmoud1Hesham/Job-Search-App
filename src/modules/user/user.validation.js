import joi from 'joi';
import { generalFields } from '../../middleware/validation.middleware.js';


export const updateBasicProfile = joi.object().keys({
    firstName:generalFields.firstName,
    lastName:generalFields.lastName,
    DOB:generalFields.DOB,
    phone:generalFields.phone,
    gender:generalFields.gender
}).required()

export const shareProfile = joi.object().keys({
    profileId:generalFields.id.required()
})

export const updatePassword = joi.object().keys({
    oldPassword:generalFields.password.required(),
    password:generalFields.password.required(),
    confirmationPassword:generalFields.confirmationPassword.valid(joi.ref("password")).required()
}).required()

export const addFriend = joi.object().keys({
    friendId: generalFields.id.required(),
}).required()