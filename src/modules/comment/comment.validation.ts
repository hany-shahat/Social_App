import { z } from "zod";
import { generalFields } from "../../middleware/validation.middleware";
import { fileValidation } from "../../utils/multer/cloud.multer";


export const createComment = {
    params: z.strictObject({
        postId:generalFields.id
    }),
    body: z.strictObject({
        content: z.string().min(2).max(5000).optional(),
        attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
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

export const replyOnComment = {
    params: createComment.params.extend({
        commentId:generalFields.id
    }),
    body:createComment.body,
}
export const hardDeleteComment = {
  params: z.object({
    commentId: generalFields.id
  }),
};

export const freezeComment = {
  params: z.object({
    commentId: generalFields.id
  }),
};
export const getCommentById = {
  params: z.object({
    commentId: generalFields.id,
  })
};
export const getCommentWithReply =({
  params: z.object({
    commentId: generalFields.id,
  })
});


export const updateComment = {
    params: z.strictObject({
        postId:generalFields.id
    }),
    body: z.strictObject({
        content: z.string().min(2).max(5000).optional(),
        attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
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