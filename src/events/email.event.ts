 import { EventEmitter } from 'node:events';
import { verifyEmailTemplate } from '../email/templates/verify.email.templates';
import Mail from 'nodemailer/lib/mailer';
import { sendEmail } from '../email/send.email';
interface IEmail extends Mail.Options{
  otp:number,
}
export const emailEvent = new EventEmitter();
emailEvent.on("confirmEmail", async (data: IEmail) => {
    try {
      data.subject = "Confirm_Email"
      data.html = verifyEmailTemplate({ otp:data.otp, title: "ConfirmEmail" })
      await sendEmail(data)
    } catch (error) {
      console.log(`Fail to send email` ,error);
    }
}) 
emailEvent.on("resetPassword", async (data: IEmail) => {
    try {
      data.subject = "Reset_Account_Password"
      data.html = verifyEmailTemplate({ otp:data.otp, title: "Reset code" })
      await sendEmail(data)
    } catch (error) {
      console.log(`Fail to send email` ,error);
    }
}) 