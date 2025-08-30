import {  z } from "zod";
import { generalFields } from "../../middleware/validation.middleware";

export const signin={
    body: z.strictObject({
        email: generalFields.email,
        password: generalFields.password,
    })    
}
export const signup={
    body: signin.body.extend({
        userName: generalFields.userName,
       confirmPassword:generalFields.confirmPassword,
    })
        .superRefine((data, ctx) => {
        if (data.confirmPassword !== data.password) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmEmail"],
                message:"password mismatch  confirmPassword"
            })
        }
    })
}
export const confirmEmail={
    body: z.strictObject({
        email: generalFields.email,
       otp:generalFields.otp,
    })
}
export const signupWithGmail={
    body: z.strictObject({
       idToken:z.string()
    })
}
export const sendForgotPasswordCode={
    body: z.strictObject({
       email:generalFields.email
    })
}
export const verifyForgotPasswordCode={
    body: sendForgotPasswordCode.body.extend({
          otp:generalFields.otp,
    })
}
export const ResetForgotPasswordCode={
    body: verifyForgotPasswordCode.body.extend({
        password: generalFields.password,
        confirmPassword:generalFields.confirmPassword
    }).refine((data) => {
        return data.password === data.confirmPassword
    },{message:"password mismatch confirmPassword",path:["confirmPassword"]})
}