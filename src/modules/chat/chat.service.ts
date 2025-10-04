import type{ Request, Response } from "express";
import { ICreateChattingGroupDTO, IGetChatParamsDTO, IGetChatQueryDTO, IGetChattingGroupDTO, IJoinRoomDTO, ISayHiDTO, ISendGroupMessageDTO, ISendMessageDTO } from "./chat.dto";
import { successResponse } from "../../utils/response/success.response";
import { ChatRepository, UserRepository } from "../../DB/repository";
import { ChatModel, UserModel } from "../../DB/models";
import { Types } from "mongoose";
import { badRequestException, NotFoundException } from "../../utils/response/error.response";
import { IGetChatResponse } from "./chat.entities";
import { connectedSocket, IAuthSocket } from "../gateway";
import { v4 as uuid } from "uuid";
import { deleteFile, uploadFile } from "../../utils/multer/s3.config";

export class ChatService {
   private chatModel: ChatRepository = new ChatRepository(ChatModel)
   private userModel :UserRepository=new UserRepository(UserModel)
   constructor() { }
   // Rest api
   getChat = async (req: Request, res: Response): Promise<Response> => {
      const { userId } = req.params as IGetChatParamsDTO;
      const { page , size } : IGetChatQueryDTO= req.query ;
      const chat = await this.chatModel.findOneChat({
         filter: {
            participants: {
               $all: [
                  req.user?._id as Types.ObjectId,
                  Types.ObjectId.createFromHexString(userId)
               ],
            },
            group:{$exists:false},
         },
         options: {
            populate: [
               {
               path: "participants", select: "firstName lastName email gender profileImage"
               },
            ],
         },
         page,
         size,
      })
    if (!chat) {
      throw new badRequestException("Fail to find matching chatting instance")
    }
      return successResponse<IGetChatResponse>({res , data:{chat}})
   }
   getChattingGroup = async (req: Request, res: Response): Promise<Response> => {
      const { groupId } = req.params as IGetChattingGroupDTO;
      const { page , size } : IGetChatQueryDTO= req.query ;
      const chat = await this.chatModel.findOneChat({
         filter: {
            _id:Types.ObjectId.createFromHexString(groupId),
            participants: {$in:req.user?._id as Types.ObjectId   },
            group:{$exists:true},
         },
         options: {
            populate: [
               {
               path: "messages.createdBy", select: "firstName lastName email gender profileImage"
               },
            ],
         },
         page,
         size,
      })
    if (!chat) {
      throw new badRequestException("Fail to find matching chatting instance")
    }
      return successResponse<IGetChatResponse>({res , data:{chat}})
   }


   createChattingGroup = async (req: Request, res: Response): Promise<Response> => {
      const { group, participants }: ICreateChattingGroupDTO = req.body;
      const dpParticipants = participants.map((participants: string) => {
         return Types.ObjectId.createFromHexString(participants)
      });
      const users = await this.userModel.find({
         filter: {
            _id: { $in: dpParticipants },
            friends:{$in:req.user?._id as Types.ObjectId},
         },

      });
      if (!users) {
         throw new NotFoundException("some or all recipient all invaild");
      }
      let group_image: string | undefined =undefined;
      const roomId = group.replaceAll(/\s+/g, "_") + "_" + uuid();
      if (req.file) {
         group_image=await uploadFile({file:req.file as Express.Multer.File,path:`chat/${roomId}`})
      }
      dpParticipants.push(req.user?._id as Types.ObjectId)
      const [chat] = await this.chatModel.create({
         data: [{
            createdBy: req.user?._id as Types.ObjectId,
            group,
            roomId,
            group_image:group_image as string,
            messages:[],
            participants:dpParticipants,
         }],
      }) || [];
      if (!chat) {
         if (group_image) {
            await deleteFile({Key:group_image})
         }
         throw new badRequestException("Fail to generate this group")
      }
      return successResponse<IGetChatResponse>({res ,statusCode:201 ,data:{ chat}})
   }



   // Io
    sayHi = ({ message, socket, callback,io }:ISayHiDTO) => {
         try {
             console.log({ message });
             if (callback) {
                callback("BE to FE")
             }
          callback? callback("Hello from BE to FE"):undefined
         } catch (error) {
            socket.emit("custom_error",error)
         }
   }



   // send OVO Message
   sendMessage = async({ content, sendTo, socket, io }: ISendMessageDTO) => {
         try {
             const createdBy = (socket as IAuthSocket).credentials?.user._id  as Types.ObjectId
          console.log(createdBy);
            const user = await this.userModel.findOne({
               filter: {
                  _id: Types.ObjectId.createFromHexString(sendTo),
                  friends: { $in: createdBy },
               },
            });
            if (!user) {
               throw new NotFoundException("Invaild recipient friend")
            }
            const chat = await this.chatModel.findOneAndUpdate({
               filter: {
                  participants: {
                     $all: [
                        createdBy as Types.ObjectId,
                        Types.ObjectId.createFromHexString(sendTo)
                     ],
                  },
                  group: { $exists: false }
               },
               update: {
                  $addToSet: { messages: { content, createdBy } },
               },
            });
            if (!chat) {
               const [newChat] = await this.chatModel.create({
                  data: [{
                     createdBy,
                     messages: [{ content, createdBy }],
                     participants: [
                        createdBy as Types.ObjectId,
                        Types.ObjectId.createFromHexString(sendTo),
                     ],
                  },
                  ],
               }) || [];
               if (!newChat) {
                  throw new badRequestException("Fail to create this chat instance")
               }
            }

   //          const socketId = connectedSocket.get(createdBy.toString());
   //          if (socketId) {
   
   // io?.to(socketId).emit("successMessage", { content });
   
            //          }
            io?.to(connectedSocket.get(createdBy.toString()) as string)
               .emit("successMessage", { content });
            
            io?.to(connectedSocket.get(sendTo) as string)
               .emit("newMessage", { content , from:(socket as IAuthSocket).credentials?.user });
            
         } catch (error) {
            socket.emit("custom_error",error)
         }
   }
   // send OVM Message
   joinRoom = async({roomId, socket, io }: IJoinRoomDTO) => {
         try {
            const chat = await this.chatModel.findOne({
               filter: {
                  roomId,
                  group: { $exists: true },
                 participants:{$in:(socket as IAuthSocket).credentials?.user._id}
               },
            });
            if (!chat) {
               throw new NotFoundException("Fail to find matching room")
            }


            socket.join(chat.roomId as string);
         } catch (error) {
            socket.emit("custom_error",error)
         }
   }
   
sendGroupMessage = async({ content, groupId, socket, io }: ISendGroupMessageDTO) => {
         try {
             const createdBy = (socket as IAuthSocket).credentials?.user._id  as Types.ObjectId
          
            const chat = await this.chatModel.findOneAndUpdate({
               filter: {
                  _id: Types.ObjectId.createFromHexString(groupId),
                  participants: {
                    $in:createdBy as Types.ObjectId
                  },
                  group: { $exists: true }
               },
               update: {
                  $addToSet: { messages: { content, createdBy } },
               },
            });
            if (!chat) {
               throw new badRequestException("Fail to find matching room")
            }
            io?.to(connectedSocket.get(createdBy.toString()) as string)
               .emit("successMessage", { content });
            
            io?.to(chat.roomId as string)
               .emit("newMessage", { content , from:(socket as IAuthSocket).credentials?.user , groupId });
            
         } catch (error) {
            socket.emit("custom_error",error)
         }
   }

}