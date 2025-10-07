import { Request, Response } from "express";
import { UserRepository } from "../../DB/repository/user.repository";
import { GenderEnum, HUserDocument, IUser, RoleEnum, UserModel } from "../../DB/models/User.model";
import { IFreezeAccountDto, IHardDeleteAccountDto, IlogoutDto, IRestoreAccountDto, IUpdateBasicInfoDto, IUpdateEmailDto, IUpdatePasswordDto } from "./user.dto";
import { createLoginCredentials, createRevokeToken, LogoutEnum } from "../../utils/security/token.security";
import { Types, UpdateQuery } from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import {  createPreSignedLink, deleteFiles, deleteFolder, uploadFiles } from "../../utils/multer/s3.config";
import { StorageEnum } from "../../utils/multer/cloud.multer";
import { badRequestException, ConflictException, ForbiddenException, NotFoundException } from "../../utils/response/error.response";
import { s3Event } from "../../utils/multer/s3events";
import { successResponse } from "../../utils/response/success.response";
import { IProfileCoverImage, IProfileImageResponse } from "./user.entites";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { generateNumberOtp } from "../../email/otp";
import { emailEvent } from "../../events/email.event";
import { ChatRepository, FriendRequestRepository, PostRepository } from "../../DB/repository";
import { ChatModel, FriendRequestModel, PostModel } from "../../DB/models";




export interface IUserr { id: number; name: string; email: string; password: string; gender: GenderEnum; followers: number[] }
let users:IUserr [] = [
    {id:1 , name:"Hany" ,email:"Hany@gmail.com" ,password:"123456" , gender:GenderEnum.male ,followers:[]  } ,
    {id:2 , name:"sara" ,email:"shahat@gmail.com" ,password:"123456" , gender:GenderEnum.female ,followers:[]  } ,
    {id:3 , name:"mariam" ,email:"sadek@gmail.com" ,password:"123456" , gender:GenderEnum.female ,followers:[]  } ,
    {id:4 , name:"shaheta" ,email:"shaheha@gmail.com" ,password:"123456" , gender:GenderEnum.male,followers:[]  } ,
]
export class UserServise{
    private userModel:UserRepository =new UserRepository(UserModel)
    private postModel:PostRepository =new PostRepository(PostModel)
    private chatModel:ChatRepository =new ChatRepository(ChatModel)
    private friendRequestModel :FriendRequestRepository=new FriendRequestRepository(FriendRequestModel)
    constructor() { }
    profile = async (req: Request, res: Response): Promise<Response> => {
        const profile = await this.userModel.findById({
            id: req.user?._id as Types.ObjectId,
            options: {
                populate: [{
                    path: "friends",
                    select:"firstName lastName email gender profilePicture"
                }]
            }
        })
        if (!profile) {
            throw new NotFoundException("fail to find user profile")
        }
        const groups = await this.chatModel.find({
            filter: {
                participants: { $in: req.user?._id as Types.ObjectId },
                group:{$exists:true}
            },
        });
    return successResponse({res,data:{user:profile ,groups,decoded:req.decoded}})
    }
    changeRole = async (req: Request, res: Response): Promise<Response> => {
        const { userId } = req.params as unknown as { userId: Types.ObjectId };
        const { role }: { role: RoleEnum } = req.body;
        const denyRoles: RoleEnum[] = [role, RoleEnum.superAdmin];
        if (req.user?.role === RoleEnum.admin) {
            denyRoles.push(RoleEnum.admin)
        }
        const user = await this.userModel.findOneAndUpdate({
            filter: {
                _id: userId as Types.ObjectId,
                role: { $nin: denyRoles }
            },
            update: {
                role,
            },
        });
        if (!user) {
            throw new NotFoundException("fail to find matching result")
        }
    return successResponse({res})
    }
    dashboard = async (req: Request, res: Response): Promise<Response> => {
        const results = await Promise.allSettled([
            this.userModel.find({ filter: {} }),
          this.postModel.find({ filter: {} })
        ])
        
    return successResponse({res,data:{results}})
    }
    // profileImage = async (req: Request, res: Response): Promise<Response> => {
    //     const key = await uploadLargeFile({
    //         storageApproach:StorageEnum.disk,
    //         file: req.file as Express.Multer.File,
    //         path:`users/${req.decoded?._id}`,
    //      })
    // return res.json({message:"Done" , data:{key}})
    // }
    profileCoverImage = async (req: Request, res: Response): Promise<Response> => {
        const urls = await uploadFiles({
            storageApproach:StorageEnum.disk,
            files: req.files as Express.Multer.File[],
            path:`users/${req.decoded?._id}/cover`,
        })
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id as Types.ObjectId,
            update: {
                coverImages:urls
            }
        })
        if (!user) {
            throw new badRequestException("Fail to update profile cover images")
        }
        if (req.user?.coverImages) {
            await deleteFiles({urls:req.user?.coverImages})
        }
    return successResponse<IProfileCoverImage>({res,data:{user}})
    }
    profileImage = async (req: Request, res: Response): Promise<Response> => {
const {ContentType , Originalname}:{ContentType:string,Originalname:string}=req.body
        const { url, Key } = await createPreSignedLink({ ContentType, Originalname, path: `users/${req.decoded?._id}`, expiresIn:50 })
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id as Types.ObjectId,
            update: {
                profileImage: Key,
                temProfileImage:req.user?.profileImage
            }
        })
        if (!user) {
            throw new badRequestException("Fail to update user profile image")
        }
        s3Event.emit("trackProfileImageUpload" , {userId:req.user?._id , oldKey:req.user?.profileImage,Key , expiresIn:30} ,  )
    return successResponse<IProfileImageResponse>({res,data:{url}})
    }
    logout = async (req: Request, res: Response): Promise<Response> => {
        const { flag }: IlogoutDto = req.body;
        let statusCode: number = 200;
        const update: UpdateQuery<IUser> = {};
switch (flag) {
    case LogoutEnum.all:
        update.changeCredentialsTime = new Date();
        break;
    default:
       await createRevokeToken(req.decoded as JwtPayload)
        statusCode=201
        break;
        }
        await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update,
        })

    return successResponse({res , statusCode:statusCode})
    }
    refreshToken = async (req: Request, res: Response): Promise<Response> => {
        const credentials = await createLoginCredentials(req.user as HUserDocument)
         await createRevokeToken(req.decoded as JwtPayload)
        return successResponse({res,statusCode:201,data:{credentials}})
    }
    freazeAcount = async (req: Request, res: Response): Promise<Response> => {
        const { userId }  = (req.params as IFreezeAccountDto) || {};
        if (userId && req.user?.role !== RoleEnum.admin) {
            throw new ForbiddenException("not authorized user")
        }
        const user = await this.userModel.updateOne({
            filter: {
                _id: userId || req.user?._id,
                freezedAt:{$exists:false},
            },
            update: {
                freezedAt: new Date(),
                freezedBy: req.user?._id,
                changeCredentualsTime: new Date(),
                $unset: {
                    restoredAt:1,
                    restoredBy:1,
                }
            }
        })
        if (!user.matchedCount) {
            throw new NotFoundException(" user not found or fail to deleted this resource")
        }
        return successResponse({res})
    }
    restoreAcount = async (req: Request, res: Response): Promise<Response> => {
        const { userId }  = req.params as IRestoreAccountDto;
       
        const user = await this.userModel.updateOne({
            filter: {
                _id: userId ,
                freezedBy:{$ne:userId},
            },
            update: {
                restoredAt: new Date(),
                restoredBy: req.user?._id,
                $unset: {
                    freezedAt:1,
                    freezedBy:1,
                }
            }
        })
        if (!user.matchedCount) {
            throw new NotFoundException(" user not found or fail to restored this resource")
        }
        return successResponse({res})
    }
    hardDeleteAccount = async (req: Request, res: Response): Promise<Response> => {
        const { userId }  = req.params as IHardDeleteAccountDto;
       
        const user = await this.userModel.deleteOne({
            filter: {
                _id: userId ,
               freezedAt:{$exists:true}
            },
           
        })
        if (!user.deletedCount) {
            throw new NotFoundException(" user not found or hard delete  this resource")
        }
        await deleteFolder({path:`users/${userId}`})
        return successResponse({ res })
        

        
    }
    updatePassword = async (req: Request, res: Response): Promise<Response> => {
    
  const userId: Types.ObjectId | undefined = req.user?._id;
    const { oldPassword, newPassword } = req.body as IUpdatePasswordDto;

    if (!userId) {
      throw new badRequestException("User ID is required");
    }

    if (!oldPassword || !newPassword) {
      throw new badRequestException("Old and new passwords are required");
    }
const user = await this.userModel.findById({
      id: userId,
      select: "+password",
    });
 if (!user || !user.password) {
      throw new badRequestException("User not found");
        }
        const isMatch = await compareHash(oldPassword, user.password as string);
    if (!isMatch) {
      throw new badRequestException("Old password is incorrect");
        }
        const hashedPassword: string = await generateHash(newPassword);
        await this.userModel.findByIdAndUpdate({
      id: userId,
      update: { password: hashedPassword },
        });
        
        return successResponse({res})
    }
     updateBasicInfo = async (req: Request, res: Response): Promise<Response> => {
          const userId = req.user?._id as Types.ObjectId | undefined;
  const { userName } = req.body as IUpdateBasicInfoDto;

  if (!userId) throw new badRequestException("User ID is required");
  if (!userName) throw new badRequestException("Username is required");

  const [firstName, lastName = ""] = userName.split(" ");
  const slug = userName.replace(/\s+/g, "-");

  const updatedUser = await this.userModel.findByIdAndUpdate({
    id: userId,
    update: { firstName, lastName, slug },
    options: { new: true }
  });

  if (!updatedUser) throw new badRequestException("User not found");
        return successResponse({res})
    } 
    UpdateEmail = async (req: Request, res: Response): Promise<Response> => {
        const userId = req.user?._id as Types.ObjectId | undefined;
  const { newEmail } = req.body as IUpdateEmailDto;
 if (!userId) {
    throw new badRequestException("User ID is required");
        }
        const user = await this.userModel.findOne({
    filter: { email: newEmail },
  });
 if (user) {
    throw new badRequestException("Email is already taken");
        }
        const otp = generateNumberOtp();
  const hashedOtp = await generateHash(otp.toString());
 const updatedUser = await this.userModel.findByIdAndUpdate({
    id: userId,
    update: {
      email: newEmail,
      confirmEmailOtp: hashedOtp,
      confirmedAt: undefined,
    },
    options: { new: true },
 });
        if (!updatedUser) {
    throw new badRequestException("User not found");
        }
         emailEvent.emit("confirmEmail", {
    to: newEmail,
    otp, // الرقم العادي عشان المستخدم يشوفه
  });
        return successResponse({res})
    }
    sendFriendRequest = async (req: Request, res: Response): Promise<Response>=>{
        const { userId } = req.params as unknown as { userId: Types.ObjectId };
        const checkFriendRequestExist = await this.friendRequestModel.findOne({
            filter: {
                createdBy: { $in: [req.user?._id, userId] },
                sendTo: { $in: [req.user?._id, userId] },
            }
        });
        if (checkFriendRequestExist) {
            throw new ConflictException("Friend request already exist")
        }
        const user = await this.userModel.findOne({
            filter: { _id: userId }
        });
        if (!user) {
            throw new NotFoundException("invaild recipient")
        }
        const [friendRequest] = (await this.friendRequestModel.create({
            data: [{
                createdBy: req.user?._id as Types.ObjectId,
                sendTo: userId
            }]
        }) )|| [];
        if (!friendRequest) {
            throw new badRequestException("something went wrong!!!!!")
        }
        return successResponse({res , statusCode:201})
    }
    acceptFriendRequest = async (req: Request, res: Response): Promise<Response>=>{
        const { requestId } = req.params as unknown as { requestId: Types.ObjectId };
        const friendRequest = await this.friendRequestModel.findOneAndUpdate({
            filter: {
                _id:requestId,
                sendTo: req.user?._id,
                acceptedAt:{$exists:false}
            },
            update: {
                acceptedAt:new Date(),
            }
        });
        if (!friendRequest) {
            throw new NotFoundException("fail to find matching result")
        }
        await Promise.all([
            await this.userModel.updateOne({
                filter: { _id: friendRequest.createdBy },
                update:{$addToSet:{friends:friendRequest.sendTo}}
           })
       ])
        await Promise.all([
            await this.userModel.updateOne({
                filter: { _id: friendRequest.sendTo },
                update:{$addToSet:{friends:friendRequest.createdBy}}
           })
       ])
        return successResponse({res})
    }
deleteFriendRequest = async (req: Request, res: Response): Promise<Response> => {
    const { requestId } = req.params as unknown as { requestId: Types.ObjectId };

    const friendRequest = await this.friendRequestModel.findOne({
        filter: {
            _id: requestId,
            $or: [
                { createdBy: req.user?._id },
                { sendTo: req.user?._id }
            ]
        }
    });

    if (!friendRequest) {
        throw new NotFoundException("Friend request not found or you're not authorized");
    }

    await this.friendRequestModel.deleteOne({
        filter: { _id: requestId }
    });

    return successResponse({ res, message: "Friend request deleted successfully" });
};
 blockUser = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params;

    // تحويل الـ userId اللي جاي من البارامز إلى ObjectId
    let targetUserId: Types.ObjectId;
    try {
      targetUserId = new Types.ObjectId(userId);
    } catch {
      throw new badRequestException("Invalid user ID format");
    }

    const currentUserId = new Types.ObjectId(req.user?._id);

    // منع المستخدم من حظر نفسه
    if (targetUserId.equals(currentUserId)) {
      throw new ForbiddenException("You cannot block yourself");
    }

    // التأكد من أن المستخدم اللي هيتم حظره موجود
    const user = await this.userModel.findOne({ filter: { _id: targetUserId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // تنفيذ الحظر (هنا مثال بسيط، ممكن تعدله حسب سكيمتك)
    const updated = await this.userModel.updateOne({
      filter: { _id: currentUserId },
      update: { $addToSet: { blockedUsers: targetUserId } }, // تأكد إن عندك blockedUsers في السكيمة
    });

    if (!updated.modifiedCount) {
      throw new badRequestException("Failed to block user");
    }

    return successResponse({ res, message: "User has been blocked successfully" });
  };
    // GrapQL
    // Query
    welcome = (user:HUserDocument):string => {
        return "Hello QraphQL"
    };
    allUsers =async (args: { gender: GenderEnum },authUser:HUserDocument):Promise<HUserDocument []> => {
        return await this.userModel.find({filter:{_id:{$ne:authUser._id},gender:args.gender},})

    };
    searchUser = (args: { email: string }) => {
        const user = users.find(ele => ele.email === args.email);
        return { message: "Done", statusCode: 201, data: user };
    };
    // Mutation
    addFollowers = (args: { friendId: number; myId: number }):IUserr[] => {
        users = users.map((ele): IUserr => {
            if (ele.id === args.friendId) {
                ele.followers.push(args.myId)
            };
            return ele;
        }) as [];
        return users;
    };
}
export default new UserServise