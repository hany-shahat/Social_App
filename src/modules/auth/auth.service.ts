import { NextFunction, Request, Response } from "express"
import { IConfirmEmailBodyInputsDTO, IForgotCodeBodyInputsDTO, IGmail, IResetCodeBodyInputsDTO, ISigninBodyInputsDTO, IsignupBodyInputsDTto, IVerifyCodeBodyInputsDTO } from "./auth.dto";
import { ProviderEnum, UserModel } from "../../DB/models/User.model";
import { UserRepository } from "../../DB/repository/user.repository";
import { badRequestException, ConflictException, NotFoundException } from "../../utils/response/error.response";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../events/email.event";
import { generateNumberOtp } from "../../email/otp";
import { createLoginCredentials} from "../../utils/security/token.security";
import {OAuth2Client,type TokenPayload} from 'google-auth-library';


class AuthenticationService {
  private userModel =new UserRepository(UserModel) 
  constructor() { }
  private async verifyGmailAccount(idToken:string):Promise<TokenPayload> {
    const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
      idToken,
      audience:process.env.WEB_CLIENT_IDS?.split(",")||[],
  });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new badRequestException("Fail to verify this google account")
    }
    return payload;
  }
  signupWithGmail = async (req: Request, res: Response): Promise<Response> => {
    const { idToken }:IGmail = req.body;
    const { email, family_name, given_name,  picture } = await this.verifyGmailAccount(idToken)
    const user = await this.userModel.findOne({
      filter: {
        email,
      }
    })
    if (user) {
      if (user.provider  === ProviderEnum.GOOGLE) {
         return await this.loginWithGmail(req,res)
      }
      throw new ConflictException(`Email exist with another provider :::${user.provider}`)
    }
    const [newUser] = (await this.userModel.create({
      data: [{
        firstName: given_name as string,
        lastName: family_name as string,
        email:email as string,
        profileImage: picture as string,
        confirmedAt: new Date(),
        provider:ProviderEnum.GOOGLE,
      }]
    })) || [];
    if (!newUser) {
      throw new badRequestException("Fail to signup with gmail please try again later")
    }
    const credentials =await createLoginCredentials(newUser)
    return res.status(201).json({message:"Done" , data:{credentials}})
  }
  loginWithGmail = async (req: Request, res: Response): Promise<Response> => {
    const { idToken }:IGmail = req.body;
    const { email} = await this.verifyGmailAccount(idToken)
    const user = await this.userModel.findOne({
      filter: {
        email,
        provider:ProviderEnum.GOOGLE,
      }
    })
    if (!user) {
      throw new NotFoundException("Not register account or registered with another provider")
    }
    const credentials =await createLoginCredentials(user)
    return res.json({message:"Done" , data:{credentials}})
  }
    /**
     * 
     * @param req Express.Request
     * @param res Express.Response
     * @returns Promise<Response>
     * @example({ userName, email, password } :IsignupBodyInputsDTto)
     * return {message:"Done" ,statusCode:201}
     */
 signup = async (req: Request, res: Response, next: NextFunction) => {
   let { email, password, userName }: IsignupBodyInputsDTto = req.body;
   console.log({ email, password, userName });
   const checkUserExist = await this.userModel.findOne({
     filter: {email},
     select: "email",
     options: {
       lean: true,
      //  populate:[{path:"userName"}]
     }

   })
   if (checkUserExist) {
    throw new ConflictException("Email exist")
   }
   const otp =generateNumberOtp()
   const user = await this.userModel.createUser({ data: [{ email, userName, password: await generateHash(password),confirmEmailOtp: await generateHash(String(otp)) }] })
   emailEvent.emit("confirmEmail",{ to: email,otp})
    return res.status(201).json({ message: "Done ",data:{user}});
  };
  signin = async(req: Request, res: Response):Promise <Response> => {
    const { email, password }:ISigninBodyInputsDTO = req.body;
    const user = await this.userModel.findOne({
      filter:{email}
    })
    if (!user) {
      throw new badRequestException("In-vaild login data")
    }
    if (!user.confirmedAt) {
      throw new badRequestException("Verify your account first")
    }
    if (!await compareHash(password , user.password)) {
      throw new NotFoundException("In-vaild login data")
    }
    const credentials=await createLoginCredentials(user)
  return res.json({message:"Done" , date:{credentials}})
}
  confirmEmail = async (req: Request, res: Response):Promise <Response> => {
    const { email, otp }: IConfirmEmailBodyInputsDTO = req.body;
    const user = await this.userModel.findOne({
      filter: {
        email,
        confirmEmailOtp: { $exists: true },
        confirmedAt:{ $exists: false }
      }
    })
    if (!user) {
      throw new NotFoundException("In-vail account")
    }
    if (!await compareHash(otp , user.confirmEmailOtp as string)) {
      throw new ConflictException("In-vail confirmation code")
    }
    await this.userModel.updateOne({
      filter: { email },
      update: {
        confirmedAt: new Date(),
        $unset:{confirmEmailOtp:1}
      }
    })
  return res.json({message:"Done"})
  }
  sendForgotPassword=async(req: Request, res: Response):Promise <Response> => {
    const { email }:IForgotCodeBodyInputsDTO= req.body;
    const user = await this.userModel.findOne({
      filter:{email,provider:ProviderEnum.SYSTEM ,confirmedAt:{$exists:true}}
    })
    if (!user) {
      throw new badRequestException("In-vaild account due to one of the following reasons [not register ,invaild provider ,not confirmed account]")
    }
    const otp = generateNumberOtp();
    const result = await this.userModel.updateOne({
      filter: { email, },
      update: {
        resetPasswordOtp:await generateHash(String(otp))
      }
    })
    if (!result.matchedCount) {
      throw new badRequestException("Fail to send the reset code please try again later")
    }
    emailEvent.emit("resetPassword" , {to:email ,otp})
  return res.json({message:"Done" })
}
  verifyForgotPasswordCode=async(req: Request, res: Response):Promise <Response> => {
    const { email , otp }:IVerifyCodeBodyInputsDTO= req.body;
    const user = await this.userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        resetPasswordOtp:{ $exists: true },
      }
    })
    if (!user) {
      throw new badRequestException("In-vaild account due to one of the following reasons [not register ,invaild provider ,not confirmed account,missing resetPasswordOtp]")
    }
    if (!await compareHash(otp,user.resetPasswordOtp as string)) {
      throw new ConflictException("invaild otp")
    }
  return res.json({message:"Done" })
}
  resetForgotPasswordCode=async(req: Request, res: Response):Promise <Response> => {
    const { email , otp , password }:IResetCodeBodyInputsDTO= req.body;
    const user = await this.userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        resetPasswordOtp:{ $exists: true },
      }
    })
    if (!user) {
      throw new badRequestException("In-vaild account due to one of the following reasons [not register ,invaild provider ,not confirmed account,missing resetPasswordOtp]")
    }
    if (!await compareHash(otp,user.resetPasswordOtp as string)) {
      throw new ConflictException("invaild otp")
    }
    const result = await this.userModel.updateOne({
      filter: { email, },
      update: {
        password: await generateHash(password),
        changeCredentialsTime: new Date(),
        $unset:{resetPasswordOtp:1}
      }
    })
    if (!result.matchedCount) {
      throw new badRequestException("Fail to reset account password")
    }
  return res.json({message:"Done" })
}

}
export default new AuthenticationService();