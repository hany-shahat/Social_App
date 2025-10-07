import type { NextFunction, Request, Response } from "express"
import { badRequestException, ForbiddenException } from "../utils/response/error.response"
import { decodedToken, TokenEnum } from "../utils/security/token.security"
import { RoleEnum } from "../DB/models/User.model"
import { GraphQLError } from "graphql"

export const authentication = (tokenType:TokenEnum=TokenEnum.access) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        
        if (!req.headers.authorization) {
            throw new badRequestException("validation error", {
                key: "headers",
                issues:[{path:"authorization" , message:"missing authorization"}]
            })
        }
        const { user, decoded } = await decodedToken({
            authorization: req.headers.authorization,
            tokenType,
        })
        req.user = user;
        req.decoded = decoded
        next();
    }     
}
export const authorization = (accessRoles:RoleEnum[]=[],tokenType:TokenEnum=TokenEnum.access) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        
        if (!req.headers.authorization) {
            throw new badRequestException("validation error", {
                key: "headers",
                issues:[{path:"authorization" , message:"missing authorization"}]
            })
        }
        const { user, decoded } = await decodedToken({
            authorization: req.headers.authorization,
            tokenType,
        })
        if (!accessRoles.includes(user.role)) {
            throw new ForbiddenException("Not authorized account")
        }
        req.user = user;
        req.decoded = decoded
        next();
    }     
}
export const graphAuthorization =async (
    accessRoles: RoleEnum[] = [],
    role: RoleEnum
) => {
        if (!accessRoles.includes(role)) {
            throw new GraphQLError("Not authorized account",{extensions:{statusCode:403}})
        }
      
    }     
