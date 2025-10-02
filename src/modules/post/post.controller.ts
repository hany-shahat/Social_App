import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import {postService} from "./post.service";
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./post.validation"
import { commentRouter } from "../comment";
const router = Router();
router.use("/:postId/comment" ,commentRouter)

router.post("/post", authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.createPost),
    postService.createPost)
router.patch("/:postId/like", authentication(),
     validation(validators.likePost),
    postService.likePost)
router.patch("/:postId", authentication(),
     cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.updatePost),
    postService.updatePost)
router.get("/get-posts", authentication(),
     postService.postList)

router.patch("/:postId/freezedPost", 
    authentication(),
    validation(validators.freezedPost),
    postService.freezedPost
);
router.delete("/:postId/hard-delete",
  authentication(),
  validation(validators.hardDeletePost),
  postService.hardDeletePost
);

router.get(
  "/:postId",
  authentication(),
  validation(validators.getPostById),
  postService.getPostById
);

export default router;