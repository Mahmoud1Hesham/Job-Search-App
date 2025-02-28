import mongoose, { Schema, Types, model } from "mongoose";

const applicationSchema = new Schema({
    jobId: { type: Types.ObjectId, ref: "Job", required: true },
    userId: { type: Types.ObjectId, ref: "User", required: true },
    userCV: {
        type: {
            secure_url: { type: String },
            public_id: { type: String }
        },
        required: true
    },
    status: { type: String, enum: ["pending", "accepted", "viewed", "in consideration", "rejected"], default: "pending" }
}, { timestamps: true,toJSON:{virtuals:true},toObject:{virtuals:true} });


applicationSchema.pre("findOneAndUpdate", async function (next) {
    if (this._update.deletedAt) {
        await mongoose.model("Chat").updateMany({ $or: [{ senderId: this._conditions.userId }, { receiverId: this._conditions.userId }] }, { deletedAt: new Date() });
    }
    next();
});

applicationSchema.virtual("applicant", {
    ref: "User",
    localField: "userId",
    foreignField: "_id",
    justOne: true
});

export const applicationModel = mongoose.models.Application || model("Application", applicationSchema);