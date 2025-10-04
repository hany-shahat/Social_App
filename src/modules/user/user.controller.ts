import { Router } from "express";
import userServise from "./user.servise"
import {  authentication, authorization } from "../../middleware/authentication.middleware";
// import { endpoint } from "./user.authorization";
import * as validators from "./user.validation"
import { validation } from "../../middleware/validation.middleware";
import { TokenEnum } from "../../utils/security/token.security";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.multer";
import { endpoint } from "./user.authorization";
import { chatRouter } from "../chat";
const router = Router();
router.use("/:userId/chat" , chatRouter)

router.get("/profile" , authentication(), userServise.profile)
router.get("/dashboard" , authorization(endpoint.dashboard), userServise.dashboard)
// router.patch("/profile-image" , authentication(),cloudFileUpload({validation:fileValidation.image,storageApproach:StorageEnum.disk}).single("image") ,userServise.profileImage)
router.patch("/:userId/change-role",
  authorization(endpoint.dashboard),
  validation(validators.changeRole),
  userServise.changeRole)
router.patch("/profile-cover-images", authentication(), cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.disk }).array("images", 2), userServise.profileCoverImage)
router.patch("/profile-image" , authentication(),userServise.profileImage)
router.post("/logout" , authentication(),validation(validators.logout) ,userServise.logout)
router.post("/refresh-token" , authentication(TokenEnum.refresh),userServise.refreshToken)
router.delete("{/:userId}/freeze-account" , authentication(),validation(validators.freezeAccount),userServise.freazeAcount)
router.patch("/:userId/restore-account" , authorization(endpoint.restoreAccount),validation(validators.restoreAcount),userServise.restoreAcount)
router.delete("/:userId" , authorization(endpoint.hardDelete),validation(validators.hardDelete),userServise.hardDeleteAccount)
router.patch("/update-password", authentication(),validation(validators.UpdatePassword), userServise.updatePassword);
router.patch(
  "/update-Basic-Info",
  authentication(),
  validation(validators.UpdateBasicInfo),
  userServise.updateBasicInfo
);
router.patch(
  "/update-email",
  authentication(),                       
  validation(validators.UpdateEmail),      
  userServise.UpdateEmail                  
);
router.post(
  "/:userId/send-friend-request",
  authentication(),                       
  validation(validators.sendFriendRequest),      
  userServise.sendFriendRequest                  
);
router.patch(
  "/accept-friend-request/:requestId",
  authentication(),                       
  validation(validators.acceptFriendRequest),      
  userServise.acceptFriendRequest                  
);
router.delete(
  "/:requestId/delete-friend-request",
  authentication(),
  validation(validators.deleteFriendRequest),
  userServise.deleteFriendRequest
);
router.patch(
  "/:userId/block",
  authentication(),
  validation(validators.blockUser),
  userServise.blockUser
);


export default router;