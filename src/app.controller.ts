import connectDB from "./DB/connection.db";
// Setup Env
import { resolve } from "node:path";
import { config } from "dotenv";
config({ path: resolve("./config/.env.development") })
// Load express and express types
import express from "express"
import type { Express, Request, Response } from "express";
// Third party middleware
import cors from "cors"
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
// Modules routing
import {authRouter,userRouter ,postRouter  } from "./modules";
import { badRequestException, globalErrorHandling } from "./utils/response/error.response";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
import { createGetPreSignedLink,  getFile,  } from "./utils/multer/s3.config";
const createS3WriteStreamPipe =promisify(pipeline)
// Handle base rate limit on all api request
const limiter = rateLimit({
        windowMs: 60 * 60000,
        limit: 2000,
        message: { error: "Too Many Request Please Try  again later" },
        statusCode:4029
})
    // App-start-point
const bootstrap =async ():Promise <void> => {
     await connectDB()
    const port:number | string = process.env.PORT || 5000;
    const app: Express = express();
    // Global application middleware
    app.use(express.json())
    app.use(cors())
    app.use(helmet())
    app.use(limiter)
    // app Routing
    app.get("/", (req: Request, res: Response) => {
        res.json({message:`Wellcom ${process.env.APPLICATION_NAME}`})
    })
    // Sub-app-routing-modules
    app.use("/auth", authRouter)
    app.use("/user", userRouter)
    app.use("/post", postRouter)
    // test s3
    // delete file
   /*  app.get("/test", async (req: Request, res: Response) => {
        const { Key } = req.query as {Key:string};
        const result = await deleteFile({ Key })
        return res.json({message:"Done" , data:{result}})
    }) */
    // delete files
    /* app.get("/delete/files", async (req: Request, res: Response) => {
        const result = await deleteFiles({
            urls: [
                "SOCIAL_APP/users/68b1f9d0e6b699699dbdc9d3/621d0fdc-9d46-44a7-8b5c-24070fa1d4da_PNG_transparency_demonstration_1.png",
                "SOCIAL_APP/users/68b1f9d0e6b699699dbdc9d3/08d1c61d-8a09-4080-bf3f-4c8a392e9f09_one.jpg.jpg"
      ]})
        return res.json({message:"Done" , data:{result}})
    }) */
    // delete folder
    /* app.get("/delete/folder", async (req: Request, res: Response) => {
        await deleteFolder({path:`users/`})
        return res.json({message:"Done" , data:{}})
    }) */
//    get assats
    app.get("/upload/*path", async (req: Request, res: Response): Promise<void> => {
        const {downloadName , download="false"} = req.query as {downloadName?:string , download?:string}
        const { path } = req.params as unknown as { path: string[] }
        const Key = path.join("/")
        const s3Response = await getFile({ Key })
        console.log(s3Response.Body);
        if (!s3Response?.Body) {
            throw new badRequestException("Fail to fetch this asset")
        }
        res.setHeader("Content-type", `${s3Response.ContentType || "application/octet-stream"}`)
        if (download==="true") {
            res.setHeader("Content-Disposition", `attachment; filename="${downloadName||Key.split("/").pop()}"`); // only apply it for  download
        }
        
       return await createS3WriteStreamPipe(s3Response.Body as NodeJS.ReadableStream , res)
    })
     app.get("/upload/pre-signed/*path", async (req: Request, res: Response): Promise<Response> => {
        // const { downloadName, download = "false" } = req.query as { downloadName?: string, download?: string }
        const { path } = req.params as unknown as { path: string[] }
        const Key = path.join("/")
        const url = await createGetPreSignedLink({ Key})
       return res.json({message:"Done" , data:{url}})
     }) 
    // Hooks
   /*  async function test() {
        try {
            const userModel = new UserRepository(UserModel);
            const user = await userModel.findByIdAndUpdate({
                id: "68d929452870866b4e1b6c17" as unknown as Types.ObjectId,
                update: {
                    freezedAt:new Date(),
                }
            })
            console.log({result:user});
            
        } catch (error) {
            console.log(error);
            
        }
    }
    test() */
    
    // In-vaild routing
    app.all("{/*dummy}", (req: Request, res: Response) => {
       return res.status(404).json({message:"In-vaild application routing please check the method and url"})
    })
    // Global-error-handling
    app.use(globalErrorHandling)
    // Start server
    app.listen(port, () => {
        console.log(`Server is Running on port ${port}`);
        
    })
}
export default bootstrap