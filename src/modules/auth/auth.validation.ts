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
        // confirmPassword:generalFields.confirmPassword,
    })
        .superRefine((data, ctx) => {
        if (data.userName?.split(" ")?.length !=2) {
            ctx.addIssue({
                code: "custom",
                path: ["userName"],
                message:"userName must consist of 2 parts like ex:Json DOE"
            })
        }
    })
}