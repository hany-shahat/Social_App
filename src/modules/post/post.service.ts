import type { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import { CommentRepository, PostRepository, UserRepository } from "../../DB/repository";
import { UserModel } from "../../DB/models/User.model";
import { availabilityEnum, HPostDocument, LikeActionEnum, PostModel } from "../../DB/models/Post.model";
import { badRequestException, NotFoundException } from "../../utils/response/error.response";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import {v4 as uuid} from "uuid"
import { LikePostQueryInputDto } from "./post.dto";
import { Types, UpdateQuery } from "mongoose";
import { StorageEnum } from "../../utils/multer/cloud.multer";
import { CommentModel } from "../../DB/models";
import { connectedSocket, getIo } from "../gateway";


export const postAvilability = (req:Request) => {
    return [
                    { availability: availabilityEnum.public },
                    { availability: availabilityEnum.onlyMe, createdBy: req.user?._id },
                    {
                        availability: availabilityEnum.friends,
                        createdBy:{$in:[...(req.user?.friends || []),req.user?._id]}
                    },
                    {
                        availability: { $ne: availabilityEnum.onlyMe },
                        tags:{$in:req.user?._id},
                    }
                ]
}
class PostService{
    private userModel = new UserRepository(UserModel);
    private postModel = new PostRepository(PostModel);
    private commentModel = new CommentRepository(CommentModel);
   
    constructor() { }
    createPost = async (req:Request,res:Response) => {
        if (req.body.tags?.length && (await this.userModel.find({
            filter: { _id: { $in: req.body.tags } }})).length !== req.body.tags.length
        ){
            throw new NotFoundException("some of the mentioned users are not exist")
        }
console.log("[0] req.files ===>", req.files);
        let attachments: string[] = [];
        let assetsFolderId: string= uuid();
        if (req.files?.length) {
            

            attachments = await uploadFiles({
                files: req.files as Express.Multer.File[],
                path:`users/${req.user?._id}/post/${assetsFolderId}`
            })
        }
        const [post] = await this.postModel.create({
            data: [{
                ...req.body,
                attachments,
                assetsFolderId,
                createdBy: req.user?._id,
            }]
        }) || [];
        if (!post) {
    if (attachments.length) {
        await deleteFiles({urls:attachments})
    }
    throw new badRequestException("Fail to create this post");
}


        return successResponse({res , statusCode:201 , data:{attachments , post}})
    }
    updatePost = async (req: Request, res: Response) => {
        const { postId } = req.params as unknown as { postId: Types.ObjectId };
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                createdBy:req.user?._id
            }
        })
        if (!post) {
            throw new NotFoundException("fail to find matching result")
        }


        if (req.body.tags?.length && (await this.userModel.find({
            filter: { _id: { $in: req.body.tags , $ne:req.user?._id} }})).length !== req.body.tags.length
        ){
            throw new NotFoundException("some of the mentioned users are not exist")
        }
        let attachments: string[] = [];
        if (req.files?.length) {
            attachments = await uploadFiles({
                storageApproach: StorageEnum.memory,
                files: req.files as Express.Multer.File[],
                path: `users/${post.createdBy}/post/${post.assetsFolderId}`
            });
        }
        const updatePost = await this.postModel.updateOne({
            filter: { _id: post.id },
            update: [
                {
                    $set:
                    {
                content: req.body.content,
                allowComments: req.body.allowComments || post.allowComments,
                        availability: req.body.availability || post.availability,
               
                        attachments: {
                            $setUnion: [
                                {
                                    $setDifference: ["$attachments" ,req.body.removedAttachments||[] ],
                                    
                                },
                                attachments,

                            ]
                 },
                        tags: {
                            $setUnion: [
                                {
                                    $setDifference: ["$tags", (req.body.removedTags || []).map((tag:string) => {
                                        return Types.ObjectId.createFromHexString(tag);
                                    }) ],
                                    
                                },
                               (req.body.tags || []).map((tag:string) => {
                                        return Types.ObjectId.createFromHexString(tag);
                                    })

                            ]
                 },
                
            },
                }
            ],



     })
       
        if (!updatePost.matchedCount) {
    if (attachments.length) {
        await deleteFiles({urls:attachments})
    }
    throw new badRequestException("Fail to create this post");
        } else {
            if (req.body.removedAttachments?.length) {
                 await deleteFiles({urls:req.body.removedAttachments})
            }
}


        return successResponse({res , statusCode:201 , data:{}})
    }
    likePost = async (req: Request, res: Response): Promise<Response> => {
        const { postId } = req.params as { postId: string };
        const { action } = req.query as LikePostQueryInputDto;
        let update: UpdateQuery<HPostDocument> = { $addToSet: { likes: req.user?._id } };
        if (action === LikeActionEnum.unlike) {
            update ={ $pull: { likes: req.user?._id } }
        }
        const post = await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: postAvilability(req),
            },

            update,
        })
        if (!post) {
            throw new NotFoundException("invaild postId or post not exist")
        }
        if (action !== LikeActionEnum.unlike) {
            getIo()
                .to(connectedSocket.get(post.createdBy.toString()) as string)
                .emit("likePost", { postId, userId: req.user?._id });
        };
    return successResponse({res})
    }
    postList = async (req: Request, res: Response): Promise<Response> => {
         let { page, size } = req.query as unknown as { page: number, size: number };
         const posts = await this.postModel.paginate({
            filter: {
               
                 $and: [
                 { $or: postAvilability(req) },
                 { freezedAt: null } 
             ]
             },
             options: {
                 populate: [{
                     path: "comments",
                     match: {
                         commentId: { $exists: false },
                         freezedId: { $exists: false },
                     },
                     populate: [
                         {
                         path: "reply",
                           match: {
                         commentId: { $exists: false },
                         freezedId: { $exists: false },
                             },
                            populate: [
                         {
                         path: "reply",
                           match: {
                         commentId: { $exists: false },
                         freezedId: { $exists: false },
                     },
                     }
                     ],
                     },
                     ],
                     
                 }]
             },
            page,
            size,
        }) 
        
        
        // console.log({ N: posts.length });
//         let result = []
//     for (const post of posts.result) {
//         const comments = await this.commentModel.find({
//             filter: { postId: post._id , commentId:{$exists:false}}
//         });
// result.push({post,comments})
//         }
//         posts.result = result;
        return successResponse({res,data:{posts}})
    }
    freezedPost = async (req: Request, res: Response): Promise<Response> => {
        console.log("Reached freezedPost controller");
    const { postId } = req.params as unknown as {postId:Types.ObjectId};

    const post = await this.postModel.findOne({
        filter: {
            _id: postId,
            createdBy: req.user?._id
        }
    });

    if (!post) {
        throw new NotFoundException("Post not found or you're not authorized");
    }

    if (post.freezedAt) {
        throw new badRequestException("Post is already frozen");
    }

    const freezeTime = new Date();

    // Freeze post
    await this.postModel.updateOne({
        filter: { _id: postId },
        update: { freezedAt: freezeTime, freezedBy: req.user?._id }
    });

    // Freeze all comments related to the post
    await this.commentModel.updateMany({
        filter: { postId: post._id, freezedAt: { $exists: false } },
        update: { freezedAt: freezeTime, freezedBy: req.user?._id }
    });

    return successResponse({ res, message: "Post and its comments have been frozen successfully" });
};
hardDeletePost = async (req: Request, res: Response): Promise<Response> => {
  const { postId } = req.params as unknown as { postId: Types.ObjectId };

  const post = await this.postModel.findOne({
    filter: {
      _id: postId,
      createdBy: req.user?._id
    }
  });

  if (!post) {
    throw new NotFoundException("Post not found or you're not authorized");
  }
 if (post.attachments?.length) {
    await deleteFiles({ urls: post.attachments });
  }
  // 1. حذف كل الكومنتات المرتبطة بالبوست
  await this.commentModel.deleteMany({
    filter: { postId: post._id }
  });

  // 2. حذف البوست نفسه
  await this.postModel.deleteOne({
    filter: { _id: post._id }
  });

  return successResponse({ res, message: "Post and related comments deleted permanently" });
};

getPostById = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as unknown as { postId: Types.ObjectId };

    if (!Types.ObjectId.isValid(postId.toString())) {
      throw new badRequestException("Invalid postId");
    }

    
    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
        freezedAt: { $exists: false }  
      }
    });

    if (!post) {
      throw new NotFoundException("Post not found or it is freezed");
    }

    return successResponse({ res, message: "Post fetched successfully", data: post });
  };


}
export const postService =  new PostService();