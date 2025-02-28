import { authenticationSocket } from "../../../middleware/auth.socket.middleware.js";
import * as dbService from '../../../DB/db.service.js'
import { chatModel } from "../../../DB/models/Chat.model.js";
import { socketConnections } from "../../../DB/models/User.model.js";

export const sendMessage = (socket) => {
    return socket.on('sendMessage', async (messageData) => {
        const { data } = await authenticationSocket({ socket })
        console.log({data:data})
        if (!data.valid) {
            return socket.emit("socketErrorResponse", data)
        }
        console.log(messageData)
        const userId = data.user._id;
        const { destId, message } = messageData;
        const chat = await dbService.findOneAndUpdate({
            model: chatModel,
            filter: {
                $or: [
                    {
                        mainUser: userId,
                        subParticipant: destId
                    },
                    {
                        mainUser: destId,
                        subParticipant: userId
                    }
                ]
            },
            data: { $push: { messages: { message, senderId: userId } } }
        })
        if (!chat) {
            await dbService.create({
                model: chatModel,
                data: {
                    mainUser: userId,
                    subParticipant: destId,
                    messages: [{ message, senderId: userId }]
                }
            })
        }
        console.log({ userId: userId, friend: destId, message: message, chat })
        socket.emit("successMessage", { message })
        socket.to(socketConnections.get(destId)).emit("receiveMessage", { message })
        return "Done"
    })
}

