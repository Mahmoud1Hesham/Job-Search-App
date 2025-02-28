import { Server } from "socket.io";
import { logoutSocket, registerSocket } from "./services/chat.auth.services.js";
import { sendMessage } from "./services/message.service.js";

export const runIo = async (httpServer) => {

    const io = new Server(httpServer, {
        cors: "*"
    })

    io.on("connection", async (socket) => {
        // console.log(socket.handshake.auth)
        console.log(socket.destId?"exists":"not")
        await registerSocket(socket)
        await sendMessage(socket)
        await logoutSocket(socket)
    })
}