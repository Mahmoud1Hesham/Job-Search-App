import { Router } from "express";
import { authentication } from "../../middleware/auth.middleware.js";
import * as applicationService from './services/application.service.js'
import { fileValidationTypes, uploadCloudFile } from "../../utils/multer/cloud.multer.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from './application.validation.js'
const router = Router();


router.get('/get-applications-for-job/:jobId',authentication(),applicationService.getApplicationsForJob)
router.post('/create/:jobId',validation(validators.createApplication),authentication(),uploadCloudFile( fileValidationTypes.document).single('file'),applicationService.applyToJob)
router.patch('/accept-reject/:applicationId',validation(validators.acceptRefuseApplication),authentication(),applicationService.acceptRefuseApplication)

export default router;