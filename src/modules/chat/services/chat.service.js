import { asyncHandler } from "../../../utils/response/error.response.js";
import * as dbService from '../../../DB/db.service.js'
import { chatModel } from "../../../DB/model/Chat.model.js";
import { successResponse } from "../../../utils/response/success.response.js";

export const findOneChat = asyncHandler(async (req, res, next) => {
    const { destId } = req.params;
    const chat = await dbService.findOne({
        model: chatModel,
        filter: {
            $or: [
                {
                    mainUser: req.user._id,
                    subParticipant: destId
                },
                {
                    mainUser: destId,
                    subParticipant: req.user._id
                }
            ]
        },
        populate: [
            { path: 'mainUser' },
            { path: "subParticipant" },
            { path: "messages.senderId" }
        ]
    })
    return successResponse({ res, data: { chat } })
})