import {z  } from "zod";
import { LogoutEnum } from "../../utils/security/token.security";
import { Types } from "mongoose";
import { generalFields } from "../../middleware/validation.middleware";

export const logout={
    body: z.strictObject({
        flag:z.enum(LogoutEnum).default(LogoutEnum.only)
    })
}


export const freezeAccount = {
    params: z.object({
        userId:z.string().optional(),
    }).optional().refine((data) => {
        return data?.userId ? Types.ObjectId.isValid(data.userId) : true;
    } , {error:"invaild objectId format" , path:["userId"]})
}
export const restoreAcount = {
    params: z.object({
        userId:z.string(),
    }).refine((data) => {
        return Types.ObjectId.isValid(data.userId);
    } , {error:"invaild objectId format" , path:["userId"]})
}
export const hardDelete = restoreAcount;


export const UpdatePassword = {
    body:z.strictObject({
  oldPassword: z
    .string()
    .min(6, "Old password must be at least 6 characters long"),
  newPassword: generalFields.password,
})
} 
export const UpdateBasicInfo = {
  body: z.strictObject({
      userName:generalFields.userName
  }),
};

export const UpdateEmail = {
  body: z.strictObject({
    newEmail: generalFields.email
  }),
};
