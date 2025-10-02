import type { NextFunction, Request, Response } from "express"
import type { ZodError, ZodType } from "zod";
import {z} from "zod"
import { badRequestException } from "../utils/response/error.response";
import { Types } from "mongoose";
type keyReqType = keyof Request;
type SchemaType =Partial <Record<keyReqType, ZodType>>
export const validation = (schema:SchemaType) => {
    return (req: Request, res: Response, next: NextFunction): NextFunction => {
        const validationErrors: Array<{
            key: keyReqType,
            issues: Array<{
                message: string,
                path:( string | number | symbol | undefined)[]
            }>
        }> = [];
for (const key of Object.keys(schema) as keyReqType[]) {
    if (!schema[key]) continue;
    if (req.file) {
        req.body.attachment = req.file;
    }
    if (req.files) {
    //      console.log("REQ.FILES >>>", req.files);
    // console.log("REQ.BODY BEFORE >>>", req.body);
        req.body.attachments = req.files;
        //  console.log("REQ.BODY AFTER >>>", req.body);
    }
    const validationResult = schema[key].safeParse(req[key])
    if (!validationResult.success) {
        const errors = validationResult.error as ZodError
        validationErrors.push({
            key,
            issues: errors.issues.map((issue) => {
                return {message:issue.message ,path:issue.path}
            })
        })
    }
}
if (validationErrors.length) {
    throw new badRequestException("Validation Error", {
        validationErrors,
    }) 
}
        return next() as unknown as NextFunction
    }
}
export const generalFields = {
    userName: z.string({ error: "userName is required" })
                .min(2, { error: "min userName length is 2 char" }).max(20, { error: "max userName length is 20 char" }),
            email: z.email({ error: "vaild email must be like to exmple@gmail.com" }),
            password: z.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
    confirmPassword: z.string(),
    otp: z.string().regex(/^\d{6}$/),
    /* file: function (mimetype:string[]) {
        return z.strictObject({
            fieldname: z.string(),
            originalname: z.string(),
            encoding: z.string(),
            //  mimetype: z.enum(mimetype),
            mimetype: z.string().refine((val) => mimetype.includes(val), {
  message: "Invalid file type",
}),

            buffer: z.any().optional(),
            path: z.string(),
            size: z.number(),
        }).refine(data => {
            return data.buffer || !data.path;
        },
            { error: "neither  path or buffer is available", path: ["file"] }
        );
    } */
    file: function (mimetypes: string[]) {
    return z.strictObject({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.enum(mimetypes),
        // mimetype: z.string().refine((val) => mimetypes.includes(val), {
        //     message: "Invalid file type"
        // }),
        buffer: z.any().optional(),
        size: z.number(),
        // path optional لأن memoryStorage مش بيرجعه
        path: z.string().optional(),
    }).refine((data) => {
        return data.buffer || data.path;
    }, {
        message: "neither path nor buffer is available",
        path: ["file"]
    });
    },
    id:z.string().
            refine(data => { return Types.ObjectId.isValid(data) }, { error: "invaild objectId format" })

}