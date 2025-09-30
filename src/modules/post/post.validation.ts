import { z } from "zod";
import { AllowCommentsEnum, availabilityEnum, LikeActionEnum } from "../../DB/models/Post.model";
import { generalFields } from "../../middleware/validation.middleware";
import { fileValidation } from "../../utils/multer/cloud.multer";


export const createPost = {
    body: z.strictObject({
        content: z.string().min(2).max(5000).optional(),
        attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
        availability: z.enum(availabilityEnum).default(availabilityEnum.public),
        allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.allow),
        tags: z.array(generalFields.id)
            .max(10).optional(),
    }).superRefine((data, ctx)=> {
    if (!data.attachments && !data.content) {
        ctx.addIssue({
            code: "custom",
            path: ["content"],
            message:"sorry we cannot make post withot content and attachment"
        })
        }
        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message:"Duplicated tagged user"
            })
        }
    }),
};
export const likePost = {
    params: z.strictObject({
        postId:generalFields.id,
    }),
    query: z.strictObject({
    action:z.enum(LikeActionEnum).default(LikeActionEnum.like),
})
}