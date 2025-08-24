import * as validators from "./auth.validation"
import { validation } from "../../middleware/validation.middleware";
import authService from "./auth.service"
import { Router } from "express";
const router = Router();
router.post("/signup",validation(validators.signup) ,authService.signup)
router.post("/signin", authService.signin);
router.patch("/confirmEmail", authService.confirmEmail);



export default router;