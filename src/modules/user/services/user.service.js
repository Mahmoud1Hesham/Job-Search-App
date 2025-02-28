import { asyncHandler } from '../../../utils/response/error.response.js';
import { decryptEncryption, generateEncryption } from '../../../utils/security/encryption.js';
import * as dbService from '../../../DB/db.service.js'
import { userModel } from '../../../DB/models/User.model.js';
import { successResponse } from '../../../utils/response/success.response.js';
import { compareHash, generateHash } from '../../../utils/security/hash.security.js';
import cloud from '../../../utils/multer/cloudnary.js'


export const updateBasicProfile = asyncHandler(async (req, res, next) => {
    const updateData = { ...req.body };

    if (req.body.phone) {
        updateData.phone = generateEncryption({ plainText: req.body.phone });
    }

    const user = await userModel.findByIdAndUpdate(req.user._id, updateData, { new: true });

    if (!user) {
        return next(new Error("User not found", { cause: 404 }));
    }

    return successResponse({ res, message: "User has been updated successfully!", data: { user } });
});

export const getProfile = asyncHandler(async (req, res, next) => {
    const user = await userModel.findById(req.user._id);
    if (!user) {
        return next(new Error("User not found", { cause: 404 }));
    }

    return successResponse({ res, data: { user } });
});


export const shareProfile = asyncHandler(async (req, res, next) => {
    const { profileId } = req.params;
    if (profileId !== req.user._id.toString()) {
        const user = await dbService.findOne({
            model: userModel,
            filter: { _id: profileId, isDeleted: {$exists:false} },
            select: "firstName lastName phone profilePic coverPic"
        });

        if (!user) {
            return next(new Error("Invalid account id!", { cause: 404 }));
        }

        const userData = {
            userName: user.userName,
            phone: user.phone,
            profilePic: user.profilePic,
            coverPic: user.coverPic,
        };

        return successResponse({ res, data: userData });
    }

    return next(new Error("You cannot share your own profile!", { cause: 400 }));
});

export const updatePassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, password } = req.body;
    if (!compareHash({ plainText: oldPassword, hashValue: req.user.password })) {
        return next(new Error("invalid old password !", { cause: 400 }))
    }
    await dbService.findByIdAndUpdate({
        model: userModel,
        id: { _id: req.user._id },
        data: {
            password: generateHash({ plainText: password }),
            changeCredentialsTime: Date.now()
        },
        options: { new: true }
    })

    successResponse({ res, message: "User's password has been updated successfully!" })

})

export const uploadImage = asyncHandler(async (req, res, next) => {
    const { secure_url, public_id } = await cloud.uploader.upload(req.file.path, { folder: 'user' });
    const user = await dbService.findByIdAndUpdate({
        model: userModel,
        id: req.user._id,
        data: {
            profilePic: { secure_url, public_id }
        },
        options: { new: false }
    })
    if (user.image?.public_id) {
        await cloud.uploader.destroy(user.image.public_id)
    }
    successResponse({ res, message: "The requested Image has been uploaded successfully !", data: { file: req.file, user } })
})

export const uploadCoverImages = asyncHandler(async (req, res, next) => {
    const images = [];
    for (const file of req.files) {
        const { secure_url, public_id } = await cloud.uploader.upload(file.path, { folder: `user/${req.user._id}/cover` });
        images.push({ secure_url, public_id })
    }
    const user = await dbService.findByIdAndUpdate({
        model: userModel,
        id: req.user._id,
        data: {
            // coverImages: req.files.map(file => file.finalPath)
            coverPic: images
        },
        options: { new: true }
    })
    successResponse({ res, data: { file: req.files, user } })
})

export const deleteProfilePic = asyncHandler(async (req, res, next) => {
    const user = await dbService.findOne({
        model: userModel,
        id: req.user._id
    });
console.log(user)
    if (!user || !user.profilePic?.public_id) {
        return next(new Error("No profile picture found!", { cause: 404 }));
    }

    await cloud.uploader.destroy(user.profilePic.public_id);

    await dbService.findByIdAndUpdate({
        model: userModel,
        id: req.user._id,
        data: { profilePic: {} }, 
        options: { new: true }
    });

    successResponse({ res, message: "Profile picture deleted successfully!" });
});


export const deleteCoverPics = asyncHandler(async (req, res, next) => {
    const user = await dbService.findOne({
        model: userModel,
        id: req.user._id
    });

    if (!user || !user.coverPic || user.coverPic.length === 0) {
        return next(new Error("No cover pictures found!", { cause: 404 }));
    }

    for (const pic of user.coverPic) {
        await cloud.uploader.destroy(pic.public_id);
    }

    await dbService.findByIdAndUpdate({
        model: userModel,
        id: req.user._id,
        data: { coverPic: [] },
        options: { new: true }
    });

    successResponse({ res, message: "Cover pictures deleted successfully!" });
});

export const freezeAccount = asyncHandler(async (req, res, next) => {
    const user = await dbService.findOne({
        model: userModel,
        id: req.user._id
    });

    if (!user) {
        return next(new Error("User not found!", { cause: 404 }));
    }

    if (user.deletedAt) {
        return next(new Error("Account is already deleted!", { cause: 400 }));
    }

    await dbService.findByIdAndUpdate({
        model: userModel,
        id: req.user._id,
        data: { deletedAt: new Date() },
        options: { new: true }
    });

    successResponse({ res, message: "Your account has been deleted successfully!" });
});

export const restoreAccount = asyncHandler(async (req, res, next) => {
    const user = await dbService.findOne({
        model: userModel,
        filter: { _id: req.user._id }
    });

    if (!user) {
        return next(new Error("User not found!", { cause: 404 }));
    }

    if (!user.deletedAt) {
        return next(new Error("Account is already active!", { cause: 400 }));
    }

    await dbService.findOneAndUpdate({
        model: userModel,
        filter: { _id: req.user._id },
        data: { $unset: { deletedAt: "" } }, 
        options: { new: true }
    });

    successResponse({ res, message: "Your account has been restored successfully!" });
});


export const addFriend = asyncHandler(async (req, res, next) => {
    const { friendId } = req.body;

    if (!friendId) {
        return next(new Error("friendId is required", { cause: 400 }));
    }

    if (friendId === req.user._id.toString()) {
        return next(new Error("You cannot add yourself as a friend", { cause: 400 }));
    }

    const friendExists = await dbService.findOne({
        model: userModel,
        filter: { _id: friendId }
    });
    if (!friendExists) {
        return next(new Error("Friend not found", { cause: 404 }));
    }

    const updatedUser = await dbService.findOneAndUpdate({
        model: userModel,
        filter: { _id: req.user._id },
        data: { $addToSet: { friends: friendId } },
        options: { new: true }
    });

    await dbService.findOneAndUpdate({
        model: userModel,
        filter: { _id: friendId },
        data: { $addToSet: { friends: req.user._id } },
        options: { new: true }
    });

    return successResponse({
        res,
        status: 200,
        message: "Friend added successfully!",
        data: { user: updatedUser }
    });
});

