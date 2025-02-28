import { roleTypes } from "../DB/models/User.model.js";
import { asyncHandler } from "../utils/response/error.response.js";
import { decodeToken } from "../utils/security/token.security.js";

export const authentication = () => {
    return asyncHandler(
        async (req, res, next) => {
            req.user = await decodeToken({ authorization: req.headers.authorization,next });
            return next();
        }
    )
}


export const authorization = () => {
    return asyncHandler(
        async (req, res, next) => {
            if (!Object.values(roleTypes).includes(req.user.role)) {
                return next(new Error("Unauthorized access !", { cause: 403 }))
            }
            return next();
        }
    )
}