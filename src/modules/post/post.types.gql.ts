import { GraphQLEnumType, GraphQLID, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";
import { AllowCommentsEnum, availabilityEnum } from "../../DB/models";
import { GraphQLOneUserResponse } from "../user";
export const GraphQLAllowCommentEnum = new GraphQLEnumType({
    name: "AllowCommentsEnum",
    values: {
        allow: { value: AllowCommentsEnum.allow },
        deny: { value: AllowCommentsEnum.deny },
    },
});
export const GraphQLAvailabilityEnum = new GraphQLEnumType({
    name: "AvailabilityEnum",
    values: {
        friends: { value: availabilityEnum.friends },
        onlyMe: { value: availabilityEnum.onlyMe },
        public: { value: availabilityEnum.public },
    },
});
export const GraphQLOnePostResponse = new GraphQLObjectType({
    name: "OnePostResponse",
    fields: {
         _id: { type: GraphQLID },
    content: { type: GraphQLString },
    attachments: { type: new GraphQLList(GraphQLString) },
    assetsFolderId: { type: GraphQLString },
    availability: { type: GraphQLAvailabilityEnum },
    allowComments: { type: GraphQLAllowCommentEnum },
    likes: { type: new GraphQLList(GraphQLID) },
    tags: { type: new GraphQLList(GraphQLID) },
    freezedAt: { type: GraphQLString },
    restoredAt: { type: GraphQLString },
    freezedBy: { type: new GraphQLList(GraphQLID) },
    restoredBy: { type: new GraphQLList(GraphQLID) },
    createdAt: { type: GraphQLString },
    createdBy: { type: GraphQLOneUserResponse },
    updatedAt: { type: GraphQLString },
    }
})
export const allPosts=new GraphQLList(GraphQLOnePostResponse)