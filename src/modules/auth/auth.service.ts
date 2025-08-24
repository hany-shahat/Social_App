import { User } from "../../DB/models/User.model";
import { NextFunction, Request, Response } from "express"
import { ISigninBodyInputsDTO, IsignupBodyInputsDTto } from "./auth.dto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { badRequestException, NotFoundException } from "../../utils/response/error.response";
import { emailEvent } from "../../events/email.event";
import { customAlphabet} from "nanoid";
class AuthenticationService {
    constructor() { }
    /**
     * 
     * @param req Express.Request
     * @param res Express.Response
     * @returns Promise<Response>
     * @example({ userName, email, password } :IsignupBodyInputsDTto)
     * return {message:"Done" ,statusCode:201}
     */
signup = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, userName }: IsignupBodyInputsDTto = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new badRequestException("Email already registered");
    }
  const generateOtp = customAlphabet("0123456789", 6);
const otp = generateOtp();
    const hashedPassword = await bcrypt.hash(password, 10);
const confirmEmailOtp =await bcrypt.hash(otp , 10)
    const user = await User.create({
      userName,
      email,
        password: hashedPassword,
        confirmEmailOtp,
       isEmailVerified: false,
    });
    // const otp =customAlphabet("0123456789" , 6)()
   
    emailEvent.emit("confirmEmail", { to: email, otp:otp })
    console.log("OTP:", otp, "Length:", otp.length);
    return res
      .status(201)
      .json({ message: "User registered successfully", user});
  };
signin = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: ISigninBodyInputsDTO = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new NotFoundException("User not found");
    }
if (!user.isEmailVerified) {
    throw new NotFoundException("please varify your account first");
}
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new badRequestException("Invalid email or password");
    }
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" } 
    );
    const refreshToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );
    return res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  };
   confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ 
    email, 
    isEmailVerified: false, 
    confirmEmailOtp: { $exists: true } 
  });

  if (!user) {
    return next(new NotFoundException("User not found or already verified"));
  }
  const isOtpValid = await bcrypt.compare(otp, user.confirmEmailOtp!);
  if (!isOtpValid) {
    return next(new badRequestException("Invalid OTP"));
  }
  const updatedUser = await User.updateOne(
    { email },
    {
      $set: { isEmailVerified: true },
      $unset: { confirmEmailOtp: "" }, 
      $inc: { __v: 1 }
    }
  );

  if (updatedUser.modifiedCount === 0) {
    return next(new Error("Failed to confirm email"));
  }

  return res.status(200).json({ message: "Done" });
}; 
    
}
export default new AuthenticationService();