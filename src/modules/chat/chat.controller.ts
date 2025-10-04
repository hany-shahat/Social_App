import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import * as validators from "./chat.validation"
import { validation } from "../../middleware/validation.middleware";
import { ChatService } from "./chat.service";
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
const router = Router({mergeParams:true});
const chatService:ChatService =new ChatService()
router.get("/",authentication(),validation(validators.getChat),chatService.getChat)
router.post("/group",
    authentication(),
    cloudFileUpload({ validation: fileValidation.image }).single("attachment"),
     validation(validators.createChattingGroup),
     chatService.createChattingGroup)

router.get("/group/:groupId",
    authentication(),
     validation(validators.getChattingGroup),
     chatService.getChattingGroup)




export default router;