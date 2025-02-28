import * as dbService from '../DB/db.service.js'
import { userModel } from '../DB/models/User.model.js';
import { tokenTypes, verifyToken } from '../utils/security/token.security.js';



export const authenticationSocket = async ({ socket = {}, tokenType = tokenTypes.access } = {}) => {


    const [bearer, token] = socket?.handshake?.auth?.authorization?.split(" ") || [];

    if (!bearer || !token) {
        return { data: { Message: "Authorization is required or invalid format", status: 400 } }
    }

    let accessSignature = "";
    let refreshSignature = "";

    switch (bearer) {
        case 'System':
            accessSignature = process.env.SYSTEM_ACCESS_TOKEN
            refreshSignature = process.env.SYSTEM_REFRESH_TOKEN
            break;
        case 'Bearer':
            accessSignature = process.env.USER_ACCESS_TOKEN
            refreshSignature = process.env.USER_REFRESH_TOKEN
            break;
        default:
            break;
    }
    const decoded = verifyToken({ token, signature: tokenType == tokenTypes.access ? accessSignature : refreshSignature })
    if (!decoded?.id) {
        return { data: { Message: "Invalid Token Payload", status: 401 } }
    }
    const user = await dbService.findOne({ model: userModel, filter: { _id: decoded.id, isDeleted: { $exists: false } } });
    if (!user) {
        return { data: { Message: "Invalid account", status: 401 } }
    }
    if (user.changeCredentialsTime?.getTime() >= decoded.iat * 1000) {
        return { data: { Message: "Invalid credentials", status: 404 } }
    }
    return {data :{user, valid: true }};

}
export const authorization = async ({ accessRoles = [], role } = {}) => {
    if (!accessRoles.includes(role)) {
        return { data: { Message: "Not authorized account !", status: 403 } }
    }
    return true;
}