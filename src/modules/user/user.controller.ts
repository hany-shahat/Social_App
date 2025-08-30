import { Router } from "express";
const router = Router();
import userServise from "./user.servise"
import {  authentication } from "../../middleware/authentication.middleware";
// import { endpoint } from "./user.authorization";
import * as validators from "./user.validation"
import { validation } from "../../middleware/validation.middleware";
import { TokenEnum } from "../../utils/security/token.security";


router.get("/profile" , authentication(), userServise.profile)
router.post("/logout" , authentication(),validation(validators.logout) ,userServise.logout)
router.post("/refresh-token" , authentication(TokenEnum.refresh),userServise.refreshToken)



export default router;