import { Server } from "socket.io";
import { IAuthSocket } from "../gateway";
import { chatEvent } from "./chat.events";

export class ChatGateway {
    private chatEvent = new chatEvent();
    constructor() { }
    register = (socket: IAuthSocket,io:Server) => {
        this.chatEvent.sayHi(socket,io)
        this.chatEvent.sendMessage(socket,io)
        this.chatEvent.joinRoom(socket,io)
        this.chatEvent.sendGroupMessage(socket, io)
        this.chatEvent.typing(socket, io);
    };
}