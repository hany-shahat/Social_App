import { NextFunction, Request, Response } from "express";


export interface IError extends Error{
       statusCode: number  
}
export class ApplicationException extends Error{
    constructor(message: string, public statusCode: Number= 400,cause?: unknown) {
        super(message,{cause});
        this.name = this.constructor.name;
        Error.captureStackTrace(this ,this.constructor)
    }
    
}
export class badRequestException extends ApplicationException{
    constructor(message: string,cause?: unknown) {
        super(message,400,cause);
    } 
}
export class NotFoundException extends ApplicationException{
    constructor(message: string,cause?: unknown) {
        super(message,404,cause);
    }
    
}
 export const globalErrorHandling=(error:IError, req: Request, res: Response , next:NextFunction) => {
    return res.status(error.statusCode || 500).json({ 
            err_message: error.message || "something want wrong"
            , stack: process.env.MOOD === "development" ? error.stack : undefined,
        cause: error.cause,
          error
        })
    } 
  /*  export const globalErrorHandling = (
  error: IError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    error: {
      statusCode,
      name: error.name || "Error",
      message: error.message || "Something went wrong",
      cause: error.cause,
      stack: process.env.MOOD === "development" ? error.stack : undefined,
    },
  });
}; */