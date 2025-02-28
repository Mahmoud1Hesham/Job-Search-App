import { userModel } from "../../DB/models/User.model.js";
import { compareHash } from "./hash.security.js";
import * as dbService from '../../DB/db.service.js'
const handleOtpValidation = async ({
    email,
    code,
    successCallback,
    flag
}) => {
    try {

        console.log("Finding user for email:", email); 
        const user = await dbService.findOne({ model: userModel, filter: { email } });

        if (!user) {
            console.log("User not found for email:", email); 
            return { message: "Email does not exist!", cause: 404 }
        }

        const currentTime = new Date();
        console.log("Current time:", currentTime); 

        if (user.banUntil && currentTime < user.banUntil) {
            const timeLeft = Math.ceil((user.banUntil - currentTime) / 1000); 
            console.log("User is banned. Time left:", timeLeft); 
            return { message: ` You are temporarily banned. Try again in ${timeLeft} seconds.`, cause: 403 }
        }

        const otpExpirationTime = new Date(user.otpGeneratedAt);
        otpExpirationTime.setMinutes(otpExpirationTime.getMinutes() + 10);
        if (currentTime > otpExpirationTime) {
            console.log("OTP expired for email:", email); 
            return { message: "OTP has expired!", cause: 400 }
        }
        if (!compareHash({ plainText: `${code}`, hashValue: flag == "email" ? user.emailOTP : user.forgetPasswordOTP })) {
            console.log("Invalid OTP for email:", email); 
            let failedAttempts = (user.failedAttempts || 0) + 1;

            if (failedAttempts >= 5) {
                const banUntil = new Date();
                banUntil.setMinutes(banUntil.getMinutes() + 5);

                console.log("User banned for 5 minutes. Email:", email); 
                await dbService.updateOne({
                    model: userModel,
                    filter: { email },
                    data: { failedAttempts, banUntil, $unset: { forgetPasswordOTP: "", emailOTP: "" } }
                });
                failedAttempts = 0;
                return { message: "Too many failed attempts. You are temporarily banned for 5 minutes.", cause: 403 }
            }

            console.log("Incrementing failed attempts for email:", email); 
            await dbService.updateOne({ model: userModel, filter: { email }, data: { failedAttempts } });
            return { message: "Invalid OTP code!", cause: 400 }
        }

        console.log("OTP validated successfully for email:", email); 
        await successCallback(user);

        console.log("Clearing OTP and failed attempts for email:", email); 
        await dbService.updateOne({
            model: userModel,
            filter: { email },
            data: { $unset: { forgetPasswordOTP: "", emailOTP: "", failedAttempts: "", banUntil: "" } }
        });
    } catch (error) {
        console.log("Error occurred in handleOtpValidation for email:", email, "Error:", error); 
        return { message: error.message, cause: 500 }
    }
};


export default handleOtpValidation