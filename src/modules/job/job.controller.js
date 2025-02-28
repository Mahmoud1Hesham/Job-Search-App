import { Router } from "express";
import { authentication } from "../../middleware/auth.middleware.js";
import * as jobService from './services/job.service.js'
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from './job.validation.js'
const router = Router();

router.get("/", authentication(), jobService.getJobs); 
router.get("/filter", authentication(), jobService.filterJobs); 
router.post("/add",validation(validators.createJob), authentication(), jobService.addJob);
router.patch("/update/:jobId",validation(validators.updateJob), authentication(), jobService.updateJob);
router.delete("/delete/:jobId",validation(validators.deleteJob), authentication(), jobService.deleteJob);

export default router;