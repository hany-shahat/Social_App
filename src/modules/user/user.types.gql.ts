import { GraphQLBoolean, GraphQLEnumType, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { GenderEnum, HUserDocument, ProviderEnum, RoleEnum } from "../../DB/models";
import { GraphQLUniformResponse } from "../graphql/types.gql";

export const GraphQLGenderEnum = new GraphQLEnumType({
    name: "GeaphQLGenderEnum",
    values: {
        male: { value: GenderEnum.male },
        female: { value: GenderEnum.female },
                                    
    },
});
export const GraphQLProviderEnum = new GraphQLEnumType({
    name: "GeaphQLProviderEnum",
    values: {
        system: { value: ProviderEnum.SYSTEM },
        google: { value: ProviderEnum.GOOGLE },
                                    
    },
});
export const GraphQLRoleEnum = new GraphQLEnumType({
    name: "GeaphQLRoleEnum",
    values: {
        user: { value: RoleEnum.user },
        admin: { value: RoleEnum.admin},
        superAdmin: { value: RoleEnum.superAdmin },
                                    
    },
});




export const GraphQLOneUserResponse = new GraphQLObjectType({
    name: "OneUersResponse",
    fields: {
       _id: {type:GraphQLID},
         firstName: {type:GraphQLString},
         lastName: {type:GraphQLString},
        userName: {
            type: GraphQLString,
            resolve: (parent: HUserDocument) => {
                 return parent.gender === GenderEnum.male? `:Mr::${parent.userName}`:`Miss :: ${parent.userName}`
             },
         },
         email: {type:GraphQLString},
         confirmEmailOtp: {type:GraphQLString},
         confirmedAt: {type:GraphQLString},
         password: {type:GraphQLString},
         resetPasswordOtp: {type:GraphQLString},
         changeCredentialsTime:{type:GraphQLString},
         address: {type:GraphQLString},
         phone: {type:GraphQLString},
         profileImage: {type:GraphQLString},
         temProfileImage: {type:GraphQLString},
         coverImages: {type:new GraphQLList(GraphQLString)},
         gender: {type:GraphQLGenderEnum},
         role:  {type:GraphQLRoleEnum},
         provider:  {type:GraphQLProviderEnum},
         createdAt: {type:GraphQLString},
         updatedAt: {type:GraphQLString},
         freezedAt: {type:GraphQLString},
         freezedBy: {type:GraphQLID},
         restoredAt: {type:GraphQLString},
         restoredBy: {type:GraphQLID},
         blockedUsers: { type: new GraphQLList(GraphQLID) },
         friends:{type:new GraphQLList(GraphQLID)},
         slug: {type:GraphQLString},
         taggedInPosts: {type:new GraphQLList(GraphQLID)},
    },
});






export const welcome = new GraphQLNonNull(GraphQLString);
export const allUsers = new GraphQLList(GraphQLOneUserResponse);
export const checkBoolean = new GraphQLNonNull(GraphQLBoolean);
export const searchUser = GraphQLUniformResponse({ name: "SearchUser", data: GraphQLOneUserResponse });
export const addFollowers = new GraphQLList(GraphQLOneUserResponse);
