import * as chatService from '../chat/services/chat.service.js'
import { Router } from "express";
import { authentication } from "../../middleware/auth.middleware.js";

const router = Router()


router.get('/:destId',authentication(),chatService.findOneChat)


export default router;