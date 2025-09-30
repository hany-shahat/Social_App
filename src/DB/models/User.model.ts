import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../events/email.event";

export enum GenderEnum{
  male = "male",
  female ="female"
}
export enum RoleEnum{
  user = "user",
  admin="admin"
}
export enum ProviderEnum{
  GOOGLE = "GOOGLE",
  SYSTEM="SYSTEM"
}

export interface IUser{
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  userName?: string;
  email: string;
  confirmEmailOtp?: string;
  confirmedAt?: Date;
  password: string;
  resetPasswordOtp?: string;
  changeCredentialsTime?:Date;
  address?: string;
  phone?: string;
  profileImage?: string;
  temProfileImage?: string;
  coverImages?: string[];
  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;
  createdAt: Date;
  updatedAt?: Date;
  freezedAt?: Date;
  freezedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;
  slug: string;
  taggedInPosts: Types.ObjectId[];
}
const userSchema = new Schema<IUser>(
  {
   firstName: {type:String ,required:true ,minlength:2 , maxlength:25},
  lastName:  {type:String , required:true,minlength:2 , maxlength:25},
  slug:  {type:String , required:true,minlength:5 , maxlength:50},
  email: {type:String ,required:true ,unique:true},
  confirmEmailOtp:{type:String},
  confirmedAt:{type:Date} ,
  password: {type:String , required:function () {
    return this.provider === ProviderEnum.GOOGLE ? false : true;
  }},
  resetPasswordOtp: {type:String},
    changeCredentialsTime: { type: Date },
    phone: { type: String},
    profileImage: { type: String },
    temProfileImage: { type: String },
    coverImages:[String],
  address:{type:String },
  gender: {type:String ,enum:GenderEnum, default:GenderEnum.male},
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },
    taggedInPosts: [{ type: Schema.Types.ObjectId, ref: "Post" }],

  freezedAt: Date,
  freezedBy: {type:Schema.Types.ObjectId,ref:"User"},
  restoredAt: Date,
  restoredBy: {type:Schema.Types.ObjectId,ref:"User"},
  provider:{type:String ,enum:ProviderEnum, default:ProviderEnum.SYSTEM},
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery:true,
  }
);
//  export type HUserDocument = HydratedDocument<IUser>;
userSchema.virtual("userName").set(function (value:string) {
  const [firstName, lastName] = value.split(" ") || [];
  this.set({firstName , lastName , slug:value.replaceAll(/\s+/g,"-")})
}).get(function () {
  return this.firstName + " " + this.lastName;
})
// mongoose middleware , pre oost hooks
/* userSchema.pre("validate" , function (next) {
  console.log({pre_validate:this});
  next()
})
userSchema.post("validate" , function (doc,next) {
  console.log({post_validate:this});
  next()
}) */
// query middleWare mongoose
  /* userSchema.pre("findOneAndUpdate", async function (next) {
  const query = this.getQuery();
  const update = this.getUpdate() as UpdateQuery<HUserDocument>;
  
  if (update.freezedAt) {
    this.setUpdate({ ...update, changeCredentialsTime: new Date() });
  }
  console.log({query , update});
  
})
userSchema.post("findOneAndUpdate", async function (doc,next) {
  const query = this.getQuery();
  const update = this.getUpdate() as UpdateQuery<HUserDocument>;
  
  if (update["$set"].changeCredentialsTime) {
    const tokenModel = new TokenRepository(TokenModel);
    await tokenModel.deleteMany({
      filter:{userId:query._id}
    })
    console.log({query , update:update["$set"].changeCredentialsTime });
    
  }
  console.log({query , update});
  
}) */

// signup
// hash password and confirmEmail
userSchema.pre("save", async function (
  this: HUserDocument & { wasNew: boolean; confirmEmailPlainOtp?: string },
  next) {
  if (this.isModified("password")) {
    this.password =await generateHash(this.password)
  }
  this.wasNew=this.isNew
  if (this.isModified("confirmEmailOtp")) {
    this.confirmEmailPlainOtp =this.confirmEmailOtp as string
    this.confirmEmailOtp = await generateHash(this.confirmEmailOtp as string)
  }
  next()
})
// sent code to email
userSchema.post("save", async function (doc, next) {
  const that =this as  HUserDocument & { wasNew: boolean; confirmEmailPlainOtp?: string }
  if (that.wasNew && that.confirmEmailPlainOtp) {
   console.log(">>> ABOUT TO EMIT EMAIL EVENT");
   emailEvent.emit("confirmEmail", {
    to: this.email,
    otp: that.confirmEmailPlainOtp
  })
 }
})
userSchema.pre(["find" , "findOne"], function (next) {
  const query = this.getQuery();
if (query.paranoid === false) {
  this.setQuery({...query})
} else {
  this.setQuery({...query , freezetAt:{$exists:false}})
  }
  next()
})

export const UserModel =models.User || model<IUser>("User", userSchema);
export type HUserDocument = HydratedDocument<IUser>



