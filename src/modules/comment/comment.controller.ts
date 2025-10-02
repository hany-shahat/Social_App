import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
import commentService from "./comment.service";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./comment.validation"
const router = Router({mergeParams:true});

router.post("/", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.createComment),
    commentService.createComment
)
router.post("/:commentId/reply", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.replyOnComment),
    commentService.replyOnComment
)
router.delete("/:commentId", 
  authentication(),
  validation(validators.hardDeleteComment),
  commentService.hardDeleteComment
);
router.patch(
  "/:commentId",
  authentication(),
  validation(validators.freezeComment),
  commentService.freezeComment
);
router.get("/:commentId", 
  authentication(), 
  validation(validators.getCommentById), 
  commentService.getCommentById
);
router.get(
  "/:commentId",
  authentication(),
  validation(validators.getCommentWithReply),
  commentService.getCommentWithReply
);
router.patch(
  "/:commentId",
  authentication(),
  cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
  validation(validators.updateComment),
  commentService.updateComment
);

export default router;

