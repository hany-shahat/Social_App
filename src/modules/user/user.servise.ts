import { Request, Response } from "express";
import { UserRepository } from "../../DB/repository/user.repository";
import { HUserDocument, IUser, RoleEnum, UserModel } from "../../DB/models/User.model";
import { IFreezeAccountDto, IHardDeleteAccountDto, IlogoutDto, IRestoreAccountDto, IUpdateBasicInfoDto, IUpdateEmailDto, IUpdatePasswordDto } from "./user.dto";
import { createLoginCredentials, createRevokeToken, LogoutEnum } from "../../utils/security/token.security";
import { Types, UpdateQuery } from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import {  createPreSignedLink, deleteFiles, deleteFolder, uploadFiles } from "../../utils/multer/s3.config";
import { StorageEnum } from "../../utils/multer/cloud.multer";
import { badRequestException, ForbiddenException, NotFoundException } from "../../utils/response/error.response";
import { s3Event } from "../../utils/multer/s3events";
import { successResponse } from "../../utils/response/success.response";
import { IProfileCoverImage, IProfileImageResponse } from "./user.entites";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { generateNumberOtp } from "../../email/otp";
import { emailEvent } from "../../events/email.event";




class UserServise{
    private userModel =new UserRepository(UserModel)
    constructor() { }
     profile = async (req: Request, res: Response):Promise<Response>=> {
    return successResponse({res,data:{user:req.user ,decoded:req.decoded}})
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
        const { url, Key } = await createPreSignedLink({ ContentType, Originalname, path: `users/${req.decoded?._id}` })
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
        s3Event.emit("trackProfileImageUpload" , {userId:req.user?._id , oldKey:req.user?.profileImage,Key , expiresIn:30000} ,  )
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
}
export default new UserServise