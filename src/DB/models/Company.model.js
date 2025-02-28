import mongoose, { model, Schema, Types } from "mongoose";

const companySchema = new Schema({
    companyName: { type: String, required: true, unique: true },
    description: { type: String },
    industry: { type: String },
    address: { type: String },
    numberOfEmployees: { type: String },
    companyEmail: { type: String, required: true, unique: true },
    owner: { type: Types.ObjectId, ref: "User" },
    logo: { secure_url: String, public_id: String },
    coverPics: [{ secure_url: String, public_id: String }],
    HRs: [{ type: Types.ObjectId, ref: "User" }],
    bannedAt: { type: Date },
    deletedAt: { type: Date },
    legalAttachment: { secure_url: String, public_id: String },
    approvedByAdmin: { type: Boolean, default: false }
}, { timestamps: true , toJSON:{virtuals:true} ,toObject:{virtuals:true}});

companySchema.virtual("jobs", {
    ref: "Job",
    localField: "_id",
    foreignField: "companyId"
});

companySchema.pre("findOneAndUpdate", async function (next) {
    if (this._update.deletedAt) {
        await mongoose.model("Job").deleteMany({ companyId: this._conditions._id });
    }
    next();
});


export const companyModel = mongoose.models.Company || model("Company", companySchema);
