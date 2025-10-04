import { z } from "zod";
import { Server, Socket } from "socket.io";
import { createChattingGroup, getChat, getChattingGroup } from "./chat.validation";
export interface IMainDTO{
    socket: Socket;
    callback?: any;
    io?: Server;
}
export interface ISayHiDTO extends IMainDTO{
    message: string;
}
export interface ISendMessageDTO extends IMainDTO{
    content: string;
    sendTo: string;
}
export interface ISendGroupMessageDTO extends IMainDTO{
    content: string;
    groupId: string;
}
export interface IJoinRoomDTO extends IMainDTO{
    roomId: string;
}
export type IGetChatParamsDTO = z.infer<typeof getChat.params>
export type IGetChatQueryDTO = z.infer<typeof getChat.query>
export type ICreateChattingGroupDTO = z.infer<typeof createChattingGroup.body>
export type IGetChattingGroupDTO = z.infer<typeof getChattingGroup.params>