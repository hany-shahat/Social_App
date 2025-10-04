import { Server } from "socket.io";
import { connectedSocket, IAuthSocket } from "../gateway";
import { ChatService } from "./chat.service";

export class chatEvent{
    private chatService:ChatService=new ChatService()
    constructor() { }
    sayHi = (socket:IAuthSocket,io:Server) => {
        return socket.on("sayHi", (message:string, callback) => {
          return this.chatService.sayHi({message,socket,callback,io})
        });
    }
    sendMessage = (socket:IAuthSocket,io:Server) => {
        return socket.on("sendMessage", (data: { content: string;  sendTo:string}) => {
         return  this.chatService.sendMessage({...data,socket,io})
        });
    }
    joinRoom = (socket:IAuthSocket,io:Server) => {
        return socket.on("join_room", (data: { roomId:string}) => {
         return  this.chatService.joinRoom({...data,socket,io})
        });
    }
    sendGroupMessage = (socket:IAuthSocket,io:Server) => {
        return socket.on("sendGroupMessage", (data: { content:string , groupId:string}) => {
         return  this.chatService.sendGroupMessage({...data,socket,io})
        });
    }
    // typing event
    typing = (socket: IAuthSocket, io: Server): void => {
  socket.on("typing", (data: { to: string; isTyping: boolean }) => {
    try {
      const from = socket.credentials?.user?._id?.toString();
      if (!from) {
        socket.emit("custom_error", { message: "Unauthorized socket" });
        return;
      }

      const toSocketId = connectedSocket.get(data.to);
      if (toSocketId) {
        io.to(toSocketId).emit("typing", { from, isTyping: data.isTyping });
      }
    } catch (error) {
      socket.emit("custom_error", { message: "typing error" });
    }
  });
};

}