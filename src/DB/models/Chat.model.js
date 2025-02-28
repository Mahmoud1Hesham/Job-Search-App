import mongoose, { Schema, Types, model } from "mongoose";

const chatSchema = new Schema({
    mainUser: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    subParticipant: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    messages: [{
        message: { type: String, required: true },
        senderId: { type: mongoose.Types.ObjectId, ref: 'User', required: true }
    }]
}, { timestamps: true });

chatSchema.pre("findOneAndUpdate", async function (next) {
    if (this._update.deletedAt) {
        const filter = this.getFilter();
        const userId = filter.mainUser || filter.subParticipant;
        if (userId) {
            await mongoose.model("Application").updateMany(
                { $or: [{ senderId: userId }, { receiverId: userId }] },
                { deletedAt: new Date() }
            );
        }
    }
    next();
});

export const chatModel = mongoose.models.Chat || model("Chat", chatSchema);
