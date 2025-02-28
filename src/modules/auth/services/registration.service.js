
import * as dbService from '../../../DB/db.service.js'
import { userModel } from '../../../DB/models/User.model.js';
import { emailEvent } from '../../../utils/events/email/email.event.js';
import { asyncHandler } from '../../../utils/response/error.response.js';
import { successResponse } from '../../../utils/response/success.response.js';
import handleOtpValidation from '../../../utils/security/handleOtpVerfication.security.js';


export const signup = asyncHandler(
    async (req, res, next) => {
        const { firstName,lastName, email, password, phone ,gender,DOB } = req.body;
        if (await dbService.findOne({ model: userModel, filter: { email } })) {
            return next(new Error("Email exists !", { cause: 409 }))
        }
        const user = await dbService.create({ model: userModel, data: { firstName,lastName, email, password , phone,gender,DOB } })
        emailEvent.emit('sendConfirmEmail', { id: user._id, email })
        return successResponse({ res, message: "An otp code has been sent to your inbox", status: 201, data: { user } })
    }
)


export const confirmEmail = asyncHandler(
    async (req, res, next) => {

        const { code, email } = req.body;
        let flag = "email"
        console.log(code)
        console.log("Starting OTP validation for email:", email); // Debug log
        const verifyOtp = await handleOtpValidation({
            email,
            code,
            flag,
            successCallback: async (user) => {
                console.log("Marking email as confirmed for user:", user._id); // Debug log
                await dbService.updateOne({ model: userModel, filter: { email }, data: { confirmEmail: true } });
            },

        });
        console.log({ verified: verifyOtp })
        if (verifyOtp) {
            return next(new Error(verifyOtp.message, verifyOtp.cause))
        }
        console.log("Validation succeeded. Sending success response."); // Debug log
        return successResponse({
            res,
            message: "Email Confirmed!",
            status: 200,
        });
    }
);


export const deleteExpiredOTPs = async (expiryDuration = 10) => { 
    try {
        const now = new Date();
        const expiryTime = new Date(now.getTime() - expiryDuration * 60 * 1000);

        const result = await userModel.updateMany(
            { otpGeneratedAt: { $lte: expiryTime } },
            { $unset: { forgetPasswordOTP: 1, emailOTP: 1, otpGeneratedAt: 1 } }
        );

        console.log(`🕒 OTP Cleanup: ${result.modifiedCount} expired OTPs deleted.`);
    } catch (error) {
        console.error("❌ Error in OTP Cleanup:", error);
    }
};

