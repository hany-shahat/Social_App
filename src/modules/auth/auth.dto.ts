// export interface IsignupBodyInputsDTto{
//     userName: string,
//     email: string,
//     password:string
// }
import * as validators from "./auth.validation"
import { z } from "zod";
export type IsignupBodyInputsDTto = z.infer<typeof validators.signup.body>
 export type ISigninBodyInputsDTO = z.infer<typeof validators.signin.body>;
 export type IForgotCodeBodyInputsDTO = z.infer<typeof validators.sendForgotPasswordCode.body>;
 export type IVerifyCodeBodyInputsDTO = z.infer<typeof validators.verifyForgotPasswordCode.body>;
 export type IResetCodeBodyInputsDTO = z.infer<typeof validators.ResetForgotPasswordCode.body>;
export type IConfirmEmailBodyInputsDTO = z.infer<typeof validators.confirmEmail.body>;
export type IGmail = z.infer<typeof validators.signupWithGmail.body>;