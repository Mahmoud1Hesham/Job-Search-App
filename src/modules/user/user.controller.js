import { Router } from "express";
import * as profileService from '../user/services/user.service.js'
import * as validators from './user.validation.js'
import { validation } from "../../middleware/validation.middleware.js";
import { authentication } from "../../middleware/auth.middleware.js";
import { fileValidationTypes, uploadCloudFile } from "../../utils/multer/cloud.multer.js";
import { exportApplicationsExcel } from "./services/exportExcelFile.service.js";
const router = Router();



router.patch("/profile", validation(validators.updateBasicProfile), authentication(), profileService.updateBasicProfile)
router.get("/profile", authentication(), profileService.getProfile)
router.get("/excel-export", authentication(), exportApplicationsExcel)
router.post('/addFriend', authentication(),validation(validators.addFriend), profileService.addFriend)
router.patch("/profile/password", validation(validators.updatePassword), authentication(), profileService.updatePassword)
router.patch("/profile/freeze", authentication(), profileService.freezeAccount)
router.patch("/profile/restore", authentication(), profileService.restoreAccount)
router.patch("/profile/image", authentication(), uploadCloudFile( fileValidationTypes.image).single('image'), profileService.uploadImage)
router.patch("/profile/image/delete", authentication(), uploadCloudFile( fileValidationTypes.image).single('image'), profileService.deleteProfilePic)
router.patch("/profile/image/cover", authentication(), uploadCloudFile( fileValidationTypes.image).array('image', 5), profileService.uploadCoverImages)
router.patch("/profile/image/cover/delete", authentication(), uploadCloudFile( fileValidationTypes.image).array('image', 5), profileService.deleteCoverPics)

router.get("/profile/:profileId", validation(validators.shareProfile), authentication(), profileService.shareProfile)









export default router;