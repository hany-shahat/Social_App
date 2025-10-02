import type{ Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
 import { PostRepository, UserRepository,CommentRepository } from "../../DB/repository";
 import { AllowCommentsEnum, CommentModel, HPostDocument, PostModel, UserModel } from "../../DB/models";
import { badRequestException, ForbiddenException, NotFoundException } from "../../utils/response/error.response";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import { Types } from "mongoose";
import { postAvilability } from "../post";
import { StorageEnum } from "../../utils/multer/cloud.multer";





class CommentService {
     private userModel = new UserRepository(UserModel);
     private postModel = new PostRepository(PostModel);
    private commentModel = new CommentRepository(CommentModel);
    constructor() { }
    

    createComment = async (req: Request, res: Response): Promise<Response> => {
        const { postId } = req.params as unknown as { postId: Types.ObjectId };
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                allowComments: AllowCommentsEnum.allow,
                $or: postAvilability(req)
            }
        });
        if (!post) {
            throw new NotFoundException("fail to find matching result")
        }
        if (req.body.tags?.length && (await this.userModel.find({
            filter: { _id: { $in: req.body.tags } }})).length !== req.body.tags.length
        ){
            throw new NotFoundException("some of the mentioned users are not exist")
        }
console.log("[0] req.files ===>", req.files);
        let attachments: string[] = [];
        if (req.files?.length) {
            attachments = await uploadFiles({
                storageApproach:StorageEnum.memory,
                files: req.files as Express.Multer.File[],
                path:`users/${post.createdBy}/post/${post.assetsFolderId}`
            })
        }
        const [comment] = await this.commentModel.create({
            data: [{
                ...req.body,
                attachments,
                postId,
                createdBy: req.user?._id,
            }]
        }) || [];
        if (!comment) {
    if (attachments.length) {
        await deleteFiles({urls:attachments})
    }
    throw new badRequestException("Fail to create this comment");
}
console.log(req.params);

        return successResponse({res,statusCode:201})
    }
    replyOnComment = async (req: Request, res: Response): Promise<Response> => {
        const { postId, commentId } = req.params as unknown as { postId: Types.ObjectId; commentId:Types.ObjectId };
        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                postId,
            },
            options: {
                populate: [
                    {
                        path: "postId",
                        match: {
                             allowComments: AllowCommentsEnum.allow,
                $or: postAvilability(req)
                        }
                    }
                ]
            }
        });
        if (!comment?.postId) {
            throw new NotFoundException("fail to find matching result")
        }
        if (req.body.tags?.length && (await this.userModel.find({
            filter: { _id: { $in: req.body.tags } }})).length !== req.body.tags.length
        ){
            throw new NotFoundException("some of the mentioned users are not exist")
        }
        let attachments: string[] = [];
        if (req.files?.length) {
            const post =comment.postId as Partial<HPostDocument>
            attachments = await uploadFiles({
                storageApproach:StorageEnum.memory,
                files: req.files as Express.Multer.File[],
                path:`users/${post.createdBy}/post/${post.assetsFolderId}`
            })
        }
        const [reply] = await this.commentModel.create({
            data: [{
                ...req.body,
                attachments,
                postId,
                commentId,
                createdBy: req.user?._id,
            }]
        }) || [];
        if (!reply) {
    if (attachments.length) {
        await deleteFiles({urls:attachments})
    }
    throw new badRequestException("Fail to create this comment");
}
console.log(req.params);

        return successResponse({res,statusCode:201})
    }
/* hardDeleteComment = async (req: Request, res: Response): Promise<Response> => {
  const { commentId } = req.params as unknown as { commentId: Types.ObjectId };

  // 1. جيب الكومنت الأساسي
  const comment = await this.commentModel.findOne({
    filter: {
      _id: commentId,
      createdBy: req.user?._id
    }
  });

  if (!comment) {
    throw new NotFoundException("Comment not found or you're not authorized");
  }

  // 2. امسح الصور لو موجودة
  if (comment.attachments?.length) {
    await deleteFiles({ urls: comment.attachments });
  }

  // 3. جيب الـ replies للكومنت (لو موجودة)
  const replies = await this.commentModel.find({
    filter: {
      commentId: comment._id
    }
  });

  // 4. امسح الصور الخاصة بالـ replies
  for (const reply of replies) {
    if (reply.attachments?.length) {
      await deleteFiles({ urls: reply.attachments });
    }
  }

  // 5. احذف replies
  await this.commentModel.deleteMany({
    filter: {
      commentId: comment._id
    }
  });

  // 6. احذف الكومنت نفسه
  await this.commentModel.deleteOne({
    filter: {
      _id: comment._id
    }
  });

  return successResponse({ res, message: "Comment and its replies deleted permanently" });
}; */
 hardDeleteComment = async (req: Request, res: Response): Promise<Response> => {
  const { commentId } = req.params as unknown as { commentId: Types.ObjectId };

  // 1. جيب الكومنت الأساسي مع الـ attachments
  const comment = await this.commentModel.findOne({
    filter: {
      _id: commentId,
      createdBy: req.user?._id
    }
  });

  if (!comment) {
    throw new NotFoundException("Comment not found or you're not authorized");
  }

  // دالة حذف كومنت مع كل ردوده بشكل متكرر (recursive)
  const deleteCommentAndReplies = async (cmtId: Types.ObjectId, attachments?: string[]) => {
    // حذف صور الكومنت نفسه لو موجودة
    if (attachments?.length) {
      await deleteFiles({ urls: attachments });
    }

    // جيب الردود (replies) المرتبطة بالكومنت الحالي
    const replies = await this.commentModel.find({
      filter: {
        commentId: cmtId
      }
    });

    // لكل رد (reply) اعمل نفس العملية (حذف الصور + حذف الردود المتكررة)
    for (const reply of replies) {
      await deleteCommentAndReplies(reply._id, reply.attachments);
    }

    // امسح كل الردود للكومنت ده
    await this.commentModel.deleteMany({ filter: { commentId: cmtId } });

    // امسح الكومنت نفسه
    await this.commentModel.deleteOne({ filter: { _id: cmtId } });
  };

  // استدعي الدالة بشكل أولي على الكومنت الأساسي
  await deleteCommentAndReplies(comment._id, comment.attachments);

  return successResponse({ res, message: "Comment and its replies deleted permanently" });
}; 

freezeComment = async (req: Request, res: Response): Promise<Response> => {
  const { commentId } = req.params as unknown as { commentId: Types.ObjectId };
  const userId = req.user?._id;

  // 1. جلب الكومنت الأساسي مع البوست المرتبط بيه
  const comment = await this.commentModel.findOne({
    filter: { _id: commentId },
    options: { populate: { path: "postId", select: "createdBy" } }
  });

  if (!comment) {
    throw new NotFoundException("Comment not found");
  }

  // 2. جلب صاحب البوست
  const post = comment.postId as { createdBy: Types.ObjectId };
const postOwnerId = post.createdBy;


  // 3. التحقق من الصلاحيات: صاحب الكومنت أو صاحب البوست فقط
  if (!comment.createdBy.equals(userId) && !postOwnerId.equals(userId)) {
    throw new ForbiddenException("You are not authorized to freeze this comment");
  }

  // 4. التأكد أن الكومنت مش متجمد بالفعل
  if (comment.freezedAt) {
    throw new badRequestException("Comment is already frozen");
  }

  const freezeTime = new Date();

  // 5. دالة تجميد الكومنت والردود المرتبطة بيه بشكل متكرر
  const freezeCommentAndReplies = async (cmtId: Types.ObjectId) => {
    await this.commentModel.updateOne({
  filter: { _id: cmtId },
  update: { freezedAt: freezeTime, freezedBy: userId },
  options: {} // أو ممكن تسيبها فاضية لو مش محتاجها
});


    const replies = await this.commentModel.find({
      filter: { commentId: cmtId, freezedAt: { $exists: false } }
    });

    for (const reply of replies) {
      await freezeCommentAndReplies(reply._id);
    }
  };

  // 6. تنفيذ التجميد
  await freezeCommentAndReplies(comment._id);

  return successResponse({ res, message: "Comment and its replies have been frozen successfully" });
};
 getCommentById = async (req: Request, res: Response): Promise<Response> => {
    const { commentId } = req.params as unknown as { commentId: Types.ObjectId };

    const comment = await this.commentModel.findOne({
      filter: {
        _id: commentId,
        freezedAt: { $exists: false }, 
      },
    //   options: {
    //     populate: [
    //       { path: "createdBy", select: "userName email" },
    //       { path: "postId", select: "title" },
    //       { path: "commentId", select: "content" },
    //     ],
    //   },
    });

    if (!comment) {
      throw new NotFoundException("Comment not found or it is freezed");
    }

    return successResponse({ res, data: comment });
  };
getCommentWithReply = async (req: Request, res: Response): Promise<Response> => {
  const { commentId } = req.params as unknown as { commentId: Types.ObjectId };

 
  const comment = await this.commentModel.findOne({
    filter: { _id: commentId, freezedAt: { $exists: false } },
    options: {
      populate: [
        { path: "createdBy", select: "userName email" },  
      ],
    },
  });

  if (!comment) {
    throw new NotFoundException("Comment not found or it is freezed");
  }
  const replies = await this.commentModel.find({
    filter: { commentId: commentId, freezedAt: { $exists: false } },
    options: {
      populate: [{ path: "createdBy", select: "userName email" }],
    },
  });

  return successResponse({ res, data: { comment, replies } });
};
updateComment = async (req: Request, res: Response): Promise<Response> => {
    const { commentId } = req.params as unknown as { commentId: Types.ObjectId };
    const userId = req.user?._id;

    // جلب الكومنت والتأكد أنه موجود وغير مجمد
    const comment = await this.commentModel.findOne({
      filter: { _id: commentId, freezedAt: { $exists: false } },
    });

    if (!comment) {
      throw new NotFoundException("Comment not found or is frozen");
    }

    // التأكد من أن صاحب الكومنت هو اللي بيعدل
    if (!comment.createdBy.equals(userId)) {
      throw new ForbiddenException("You are not authorized to update this comment");
    }

    // تحقق من وجود بيانات تعديل (محتوى أو مرفقات)
    const { content, attachments } = req.body;

    if (content === undefined && attachments === undefined) {
      throw new badRequestException("No data provided to update");
    }

    // بناء بيانات التحديث
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (attachments !== undefined) updateData.attachments = attachments;

    const result = await this.commentModel.updateOne({
      filter: { _id: commentId },
      update: { $set: updateData }
    });

    if (!result.matchedCount) {
      throw new badRequestException("Failed to update comment");
    }

    return successResponse({ res, message: "Comment updated successfully" });
  };


}


export default new CommentService();