import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { UserModel } from "./User.model";



export enum availabilityEnum{
    public = "public",
    friends = "friends",
    onlyMe="only-me"
}
export enum AllowCommentsEnum{
    allow = "allow",
    deny="deny"
}
export enum LikeActionEnum{
    like = "like",
    unlike="unlike"
}
export interface IPost {
    content?: string;
    attachments?: string[];
    assetsFolderId: string;

    availability: availabilityEnum;
    allowComments: AllowCommentsEnum;

    likes?: Types.ObjectId[];
    tags?: Types.ObjectId[];


    freezedAt?: Date;
    freezedBy?: Types.ObjectId;


    restoredAt?: Date;
    restoredBy?: Types.ObjectId;

    createdAt: Date;
    createdBy: Types.ObjectId;
    
   updatedAt?: Date;
    
}
export type HPostDocument = HydratedDocument<IPost>

const postSchema = new Schema<IPost>({
    content: {type:String , minLength:2 , maxLength:5000 , required:function () {
        return !this.attachments?.length;
    }
    },
    attachments: [String],
    assetsFolderId: {type:String , required:true},

    availability: {type:String , enum:availabilityEnum , default:availabilityEnum.public},
    allowComments: {type:String , enum:AllowCommentsEnum , default:AllowCommentsEnum.allow},

    likes:[{type:Schema.Types.ObjectId , ref:"User"}],
    tags: [{type:Schema.Types.ObjectId , ref:"User"}],


    freezedAt: Date,
    freezedBy: [{type:Schema.Types.ObjectId , ref:"User"}],


    restoredAt: Date,
    restoredBy: [{type:Schema.Types.ObjectId , ref:"User"}],

    createdAt: Date,
    createdBy: [{type:Schema.Types.ObjectId , ref:"User" , }],
}, {
    timestamps: true,
    strictQuery:true
})
// creetePost>>>>>tags>>>>>>send taggedInPosts to User
postSchema.post("save", async function (doc, next) {
  if (doc.tags?.length) {
    await UserModel.updateMany(
      { _id: { $in: doc.tags } },
      { $addToSet: { taggedInPosts: doc._id } }
    );
  }
  next();
});
postSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
      const query = this.getQuery();
if (query.paranoid === false) {
  this.setQuery({...query})
} else {
  this.setQuery({...query , freezetAt:{$exists:false}})
  }
    next()
})


export const PostModel =models.Post || model<IPost>("Post" , postSchema)

