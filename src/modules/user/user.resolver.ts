import { GenderEnum, HUserDocument } from "../../DB/models";
import { graphAuthorization } from "../../middleware/authentication.middleware";
import { GraphValidation } from "../../middleware/validation.middleware";
import { IAuthGraph } from "../graphql/schema.interface.gql";
import { endpoint } from "./user.authorization";
// import { decodedToken, TokenEnum } from "../../utils/security/token.security";
import {  UserServise } from "./user.servise";
import * as validators from "./user.validation"
export class UserResolver{
    private userService: UserServise = new UserServise();
    constructor() { }
    
    welcome = async(parent: unknown, args: any,context:IAuthGraph): Promise<string> => {
        await GraphValidation<{ name: string }>(validators.welcome, args);
        await graphAuthorization(endpoint.welcome, context.user.role);
        return this.userService.welcome(context.user);
    };
    allUsers = async(parent: unknown, args: {  gender: GenderEnum },context:IAuthGraph):Promise<HUserDocument[]> => {
        return await this.userService.allUsers(args,context.user);
    };
    searchUser = (parent: unknown, args: { email: string }) => {
        return this.userService.searchUser(args);
    };
    addFollowers= (parent:unknown, args: { friendId: number; myId: number }) => { 
                      return this.userService.addFollowers(args)
                    }
}