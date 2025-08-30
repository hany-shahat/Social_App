import * as validators from "./auth.validation"
import { validation } from "../../middleware/validation.middleware";
import authService from "./auth.service"
import { Router } from "express";
const router = Router();
 router.post("/signup",validation(validators.signup) ,authService.signup)
router.post("/signin",validation(validators.signin), authService.signin);
 router.patch("/confirmEmail",validation(validators.confirmEmail), authService.confirmEmail);
 router.post("/signup-gmail",validation(validators.signupWithGmail), authService.signupWithGmail);
 router.post("/login-gmail",validation(validators.signupWithGmail), authService.loginWithGmail);
 router.patch("/send-forgot-password",validation(validators.sendForgotPasswordCode), authService.sendForgotPassword);
 router.patch("/verify-forgot-password",validation(validators.verifyForgotPasswordCode), authService.verifyForgotPasswordCode);
 router.patch("/reset-forgot-password",validation(validators.ResetForgotPasswordCode), authService.resetForgotPasswordCode);



export default router;