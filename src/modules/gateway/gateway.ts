import { Server as HttpServer } from "node:http";
import { Server } from "socket.io"
import { decodedToken, TokenEnum } from "../../utils/security/token.security";
import { IAuthSocket } from "./gateway.interface";
import { ChatGateway } from "../chat";
import { badRequestException } from "../../utils/response/error.response";


export const connectedSocket = new Map<string, string>(); //{key=>>value}
let io:undefined|Server=undefined
export const initializeIo = (httpServer: HttpServer) => {
    // initialize Io
       io = new Server(httpServer, {
        cors: {
            origin:"*"
        },
      });
    // middleware
    // listen to =>> http://localhost:3000/
    io.use(async(socket:IAuthSocket , next) => {
      try {
          const { user, decoded } = await decodedToken({
              authorization: socket.handshake?.auth.authorization || "",
              tokenType: TokenEnum.access,
          });
          connectedSocket.set(user._id.toString(), socket.id);
          socket.credentials = { user, decoded }
           io?.emit("user:online", { userId: user._id.toString() });
      } catch (error:any) {
          next(error);
      }
    })
    // disconnection
    function disconnection(socket:IAuthSocket) {
        return  socket.on("disconnect", () => {
            const userId=socket.credentials?.user._id?.toString() as string
            connectedSocket.delete(userId);
            
            io?.emit("user:offline", { userId });
            
            getIo().emit("offline", userId);

            console.log(`logeOut:::${socket.id}`);
             console.log({after_Disconnect:connectedSocket});
            
        })
    }
    // listen to =>> http://localhost:3000/
    const chatGateway :ChatGateway =new ChatGateway()
    io.on("connection", (socket: IAuthSocket) => {
       chatGateway.register(socket,getIo())
        
        disconnection(socket);     
       
    })
}
export const getIo = ():Server=> {
    if (!io) {
        throw new badRequestException("Fail to stablish server socket Io")
    }
    return io;
}