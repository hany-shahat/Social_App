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
import authController from "./modules/auth/auth.controller"
import { globalErrorHandling } from "./utils/response/error.response";
// Handle base rate limit on all api request
const limiter = rateLimit({
        windowMs: 60 * 60000,
        limit: 2000,
        message: { error: "Too Many Request Please Try  again later" },
        statusCode:4029
})
    // App-start-point
const bootstrap = (): void => {
    connectDB()
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
    app.use("/auth", authController)
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