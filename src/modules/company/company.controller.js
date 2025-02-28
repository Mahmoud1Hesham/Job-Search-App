import { Router } from "express";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from './company.validation.js';
import * as companyService from '../company/services/company.service.js'
import { authentication } from "../../middleware/auth.middleware.js";
import { fileValidationTypes, uploadCloudFile } from "../../utils/multer/cloud.multer.js";
const router = Router();

router.post("/add",validation(validators.addCompany),authentication(),companyService.addCompany)
router.post("/upload-logo",authentication(), uploadCloudFile( fileValidationTypes.image).single('logo'), companyService.uploadCompanyLogo);
router.post("/upload-cover", authentication(), uploadCloudFile( fileValidationTypes.image).array('image', 5), companyService.uploadCompanyCoverImages)
router.delete("/delete-logo",authentication(), companyService.deleteCompanyLogo);
router.delete("/delete-cover",authentication(), companyService.deleteCompanyCover);
router.patch("/update-company/:companyId",validation(validators.updateCompany),authentication(),companyService.updateCompany)
router.delete("/freeze-company/:companyId",validation(validators.freezeCompany),authentication(),companyService.freezeCompany)
router.patch("/restore-company/:companyId",validation(validators.restoreCompany),authentication(),companyService.restoreCompany)
router.get("/search-by-name/:name",validation(validators.searchByName),authentication(),companyService.searchCompanyByName)
router.get("/:companyId", validation(validators.getCompanyWithJobsValidation),companyService.getCompanyWithJobs);
router.post("/assign-hr/:companyId",validation(validators.assignHRsToCompany),authentication(),companyService.assignHRsToCompany)
export default router;