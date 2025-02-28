import mongoose, { Schema, Types, model } from "mongoose";
import { generateHash } from "../../utils/security/hash.security.js";
import { decryptEncryption, generateEncryption } from "../../utils/security/encryption.js";

export const genderTypes = { Male: "male", Female: "female" };
export const roleTypes = { User: "user", Admin: "admin" ,HR:'hr'};
export const providerTypes = { Google: "google", System: "system" };
export const otpTypes = { ConfirmEmail: "confirmEmail", ForgetPassword: "forgetPassword" };

const userSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    provider: { type: String, enum: Object.values(providerTypes), default: providerTypes.System },
    gender: { type: String, enum: Object.values(genderTypes), required: true },
    DOB: { type: Date, required: true },
    phone: { type: String },
    role: { type: String, enum: Object.values(roleTypes), default: roleTypes.User },
    confirmEmail: { type: Boolean, default: false },
    deletedAt: { type: Date },
    bannedAt: { type: Date },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    changeCredentialTime: { type: Date },
    profilePic: { secure_url: String, public_id: String },
    coverPic: [{secure_url:String,public_id:String}],
    forgetPasswordOTP: String,
    emailOTP: String,
    otpGeneratedAt: Date,
    failedAttempts: { type: Number, default: 0 },
    banUntil: Date,
    friends:{ type: Types.ObjectId, ref: "User" },

}, {
    timestamps: true, toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
});

userSchema.virtual("userName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});


userSchema.pre("findOneAndUpdate", async function (next) {
    const doc = await this.model.findOne(this.getFilter()); 
    if (doc && doc.deletedAt) { 
        await mongoose.model("Application").deleteMany({ userId: doc._id });
        await mongoose.model("Chat").deleteMany({ $or: [{ senderId: doc._id }, { receiverId: doc._id }] });
        await mongoose.model("Company").updateMany({ HRs: doc._id }, { $pull: { HRs: doc._id } });
        await mongoose.model("Job").deleteMany({ addedBy: doc._id });
    }
    next();
});



userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await generateHash({ plainText: this.password });
    }
    if (this.isModified("phone")) {
        this.phone = generateEncryption({ plainText: this.phone });
    }
    next();
});


userSchema.path("phone").get(function (value) {
    if (!value) return ""; 
    return decryptEncryption({ cypherText: value });
});
    

export const userModel = mongoose.models.User || model("User", userSchema);
export const socketConnections = new Map()