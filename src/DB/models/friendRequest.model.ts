import { HydratedDocument, model, models, Schema, Types } from "mongoose";


export interface IFriendRequest {
    createdBy: Types.ObjectId;

    sendTo: Types.ObjectId;

    createdAt: Date;
    
    updatedAt?: Date;
    
      acceptedAt?: Date;   
}
export type HFriendRequestDocument = HydratedDocument<IFriendRequest>

const friendRequestShema = new Schema<IFriendRequest>({
     createdBy: {type:Schema.Types.ObjectId , ref:"User" ,required:true },
     sendTo: {type:Schema.Types.ObjectId , ref:"User" , required:true},
    acceptedAt: Date,

   
}, {
    timestamps: true,
  strictQuery: true,
})
// creetePost>>>>>tags>>>>>>send taggedInPosts to User
/* commentSchema.post("save", async function (doc, next) {
  if (doc.tags?.length) {
    await UserModel.updateMany(
      { _id: { $in: doc.tags } },
      { $addToSet: { taggedInPosts: doc._id } }
    );
  }
  next();
}); */
friendRequestShema.pre(["findOneAndUpdate", "updateOne"], function (next) {
      const query = this.getQuery();
if (query.paranoid === false) {
  this.setQuery({...query})
} else {
  this.setQuery({...query , freezetAt:{$exists:false}})
  }
    next()
})

friendRequestShema.pre(["find" , "findOne" , "countDocuments"], function (next) {
  const query = this.getQuery();
if (query.paranoid === false) {
  this.setQuery({...query})
} else {
  this.setQuery({...query , freezetAt:{$exists:false}})
  }
  next()
})

export const FriendRequestModel = models.FriendRequest || model<IFriendRequest>("FriendRequest", friendRequestShema);


