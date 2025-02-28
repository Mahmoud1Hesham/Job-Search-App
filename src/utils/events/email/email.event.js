import { EventEmitter } from "node:events"
import { nanoid, customAlphabet } from "nanoid";
import { sendEmail, subjectTypes } from "../../email/send.email.js";
import { verificationEmailTemplate } from "../../email/template/verification.template.js";
import { userModel } from "../../../DB/models/User.model.js";
import { generateHash } from "../../security/hash.security.js";
import { forgetPasswordTemplate } from "../../email/template/forgetPassword.template.js";
import * as dbService from '../../../DB/db.service.js'

export const emailEvent = new EventEmitter({});


const sendCode = async ({ data, subject = subjectTypes.confirmEmail } = {}) => {
    const { id, email } = data;
    
    const otp = customAlphabet("0123456789", 4)();
    console.log("Generated OTP:", otp);  

    const hash = generateHash({ plainText: otp });

    let dataUpdate = {};
    switch (subject) {
        case subjectTypes.confirmEmail:
            dataUpdate = { emailOTP: hash };
            break;
        case subjectTypes.resetPassword:
            dataUpdate = { forgetPasswordOTP: hash };
            break;
    }


    await dbService.updateOne({
        model: userModel,
        filter: { _id: id },
        data: dataUpdate,
    });
    const existingUser = await dbService.findOne({ model: userModel, filter: { _id: id } });
    const updatedUser = await dbService.findOneAndUpdate({
        model: userModel,
        filter: { _id: id },
        data: dataUpdate,
        options: { new: true } 
    });
    console.log(subject)
    const html =
        subject === subjectTypes.resetPassword
            ? forgetPasswordTemplate({ code: otp })
            : verificationEmailTemplate({ code: otp });


    await sendEmail({ to: email, subject, html });
};



emailEvent.on("sendConfirmEmail", async (data) => {
    console.log('firing event confirm',data)
    await sendCode({ data, subject: subjectTypes.confirmEmail })
    console.log('Email Sent !');
})


emailEvent.on("sendForgetPassword", async (data) => {
    console.log('firing event',data)
    await sendCode({ data, subject: subjectTypes.resetPassword})
    console.log('Email Sent !');
})
