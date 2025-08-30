import type { NextFunction, Request, Response } from "express"
import type { ZodError, ZodType } from "zod";
import {z} from "zod"
import { badRequestException } from "../utils/response/error.response";
type keyReqType = keyof Request;
type SchemaType =Partial <Record<keyReqType, ZodType>>
export const validation = (schema:SchemaType) => {
    return (req: Request, res: Response, next: NextFunction): NextFunction => {
        const validationErrors: Array<{
            key: keyReqType,
            issues: Array<{
                message: string,
                path: string | number | symbol | undefined
            }>
        }> = [];
for (const key of Object.keys(schema) as keyReqType[]) {
    if (!schema[key]) continue;
    const validationResult = schema[key].safeParse(req[key])
    if (!validationResult.success) {
        const errors = validationResult.error as ZodError
        validationErrors.push({
            key,
            issues: errors.issues.map((issue) => {
                return {message:issue.message ,path:issue.path[0]}
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
            otp:z.string().regex(/^\d{6}$/),
}