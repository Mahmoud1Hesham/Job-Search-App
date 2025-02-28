import mongoose, { Schema, Types, model } from "mongoose";

export const jobLocationTypes = { Onsite: "onsite", Remotely: "remotely", Hybrid: "hybrid" };
export const workingTimeTypes = { PartTime: "part-time", FullTime: "full-time" };
export const seniorityLevelTypes = { 
    Fresh: "fresh", 
    Junior: "Junior", 
    MidLevel: "Mid-Level", 
    Senior: "Senior", 
    TeamLead: "Team-Lead", 
    CTO: "CTO"
};

const jobSchema = new Schema({
    jobTitle: { type: String, required: true },
    jobLocation: { type: String, enum: Object.values(jobLocationTypes), required: true },
    workingTime: { type: String, enum: Object.values(workingTimeTypes), required: true },
    seniorityLevel: { type: String, enum: Object.values(seniorityLevelTypes), required: true },
    jobDescription: { type: String, required: true },
    technicalSkills: [{ type: String }],
    softSkills: [{ type: String }],
    addedBy: { type: Types.ObjectId, ref: "User" },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    closed: { type: Boolean, default: false },
    companyId: { type: Types.ObjectId, ref: "Company" }
}, { timestamps: true });


jobSchema.pre("findOneAndUpdate", async function (next) {
    if (this._update.deletedAt) {
        await mongoose.model("Application").deleteMany({ jobId: this._conditions._id });
    }
    next();
});

export const jobModel = mongoose.models.Job || model("Job", jobSchema);
