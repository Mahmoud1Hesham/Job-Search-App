import { roleTypes, userModel } from "../../../DB/models/User.model.js";
import { emailEvent } from "../../../utils/events/email/email.event.js";
import { asyncHandler } from "../../../utils/response/error.response.js";
import { successResponse } from "../../../utils/response/success.response.js";
import handleOtpValidation from "../../../utils/security/handleOtpVerfication.security.js";
import { compareHash, generateHash } from "../../../utils/security/hash.security.js";
import { decodeToken, generateToken, tokenTypes, verifyToken } from "../../../utils/security/token.security.js";
import { OAuth2Client } from "google-auth-library";
import * as dbService from '../../../DB/db.service.js'

export const login = asyncHandler(
    async (req, res, next) => {
        const { email, password } = req.body;
        const user = await dbService.findOne({ model: userModel, filter: { email } });
        if (!user) {
            return next(new Error("Email not found !", { cause: 404 }))
        }
        if (!user.confirmEmail) {
            return next(new Error("Please verify you account first !", { cause: 409 }))
        }
        if (!compareHash({ plainText: password, hashValue: user.password })) {
            return next(new Error("Invalid Credentials !", { cause: 400 }))
        }

        const access_Token = generateToken({
            payload: { id: user._id }, signature:
                user.role === roleTypes.Admin ? process.env.SYSTEM_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN
        })
        const refresh_Token = generateToken({
            payload: { id: user._id }, signature:
                user.role === roleTypes.Admin ? process.env.SYSTEM_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN
            , expireIn: 604800
        })

        return successResponse({
            res, status: 200, data: {
                access_Token,
                refresh_Token
            }
        })
    }
)


export const googleLogin = asyncHandler(
    async (req, res, next) => {
        const { idToken } = req.body;

        const client = new OAuth2Client(process.env.CLIENT_ID)
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.CLIENT_ID
        })
        console.log(ticket)
        const payload = ticket.getPayload();
        if (!payload) {
            return next(new Error("Login failed : invalid payload"))
        }

        const { name, email } = payload;
        let user = await dbService.findOne({ model: userModel, filter: { email } });

        if (!user) {

            user = dbService.create({ model: userModel, data: { userName: name, email, provider: "google", confirmEmail: true } })
            console.log('signed up successfully')

            const accessToken = generateToken({
                payload: { id: user._id }, signature:
                    user.role === roleTypes.Admin ? process.env.SYSTEM_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN
            })
            const refreshToken = generateToken({
                payload: { id: user._id }, signature:
                    user.role === roleTypes.Admin ? process.env.SYSTEM_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN
                , expireIn: 31536000
            })
            return successResponse({ status: 201, message: "Signed up successfully !", res, data: { accessToken, refreshToken } })
        }
        const access_Token = generateToken({
            payload: { id: user._id }, signature:
                user.role === roleTypes.Admin ? process.env.SYSTEM_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN
        })
        const refresh_Token = generateToken({
            payload: { id: user._id }, signature:
                user.role === roleTypes.Admin ? process.env.SYSTEM_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN
            , expireIn: 31536000
        })

        console.log('logged in successfully')
        return successResponse({ res, message: "Login successful !", data: { access_Token, refresh_Token } })
    }
)


export const refreshToken = asyncHandler(
    async (req, res, next) => {
        const user = await decodeToken({ authorization: req.headers.authorization, tokenType: tokenTypes.refresh,next })

        const access_Token = generateToken({
            payload: { id: user._id }, signature:
                user.role === roleTypes.Admin ? process.env.SYSTEM_ACCESS_TOKEN : process.env.USER_ACCESS_TOKEN
        })
        
        const refresh_Token = generateToken({
            payload: { id: user._id }, signature:
                user.role === roleTypes.Admin ? process.env.SYSTEM_REFRESH_TOKEN : process.env.USER_REFRESH_TOKEN
            , expireIn: 31536000
        })

        return successResponse({
            res, status: 200, data: {
                access_Token,
                refresh_Token
            }
        })

    }
)


export const forgetPassword = asyncHandler(
    async (req, res, next) => {
        const { email } = req.body;
        const user = await dbService.findOne({ model: userModel, filter: { email, isDeleted: { $exists: false } } })
        if (!user) {
            return next(new Error("User not found !", { cause: 404 }))
        }
        if (!user.confirmEmail) {
            return next(new Error("Kindly verify your account first !", { cause: 400 }))
        }
        console.log("alive",user._id,email)
        emailEvent.emit("sendForgetPassword", { id: user._id , email })
        return successResponse({ res, message: "An otp code has been sent to your inbox" })
    }
)

export const resetPassword = asyncHandler(
    async (req, res, next) => {
        const { code, email, password } = req.body;
        let flag = "forgetPassword";
        const verifyOtp = await handleOtpValidation({
            email,
            code,
            flag,
            successCallback: async () => {
                const hashedPassword = generateHash({ plainText: password });
                await dbService.updateOne({ model: userModel, filter: { email }, data: { password: hashedPassword, changeCredentialsTime: Date.now() } });
            },
        });
        if (verifyOtp) {
            return next(new Error(verifyOtp.message, verifyOtp.cause))
        }
        return successResponse({
            res,
            message: "Password has been reset successfully!",
            status: 200,
        });
    }
);

