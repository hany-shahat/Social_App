import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  userName: string;
  email: string;
    password: string;
    confirmEmailOtp: string;
    isEmailVerified: boolean;
}

const userSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        confirmEmailOtp: { type: String },
        isEmailVerified: { type: Boolean, default: false } 
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
