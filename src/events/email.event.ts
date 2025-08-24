import { EventEmitter } from 'node:events';
import { sendEmail } from '../email/send.email';
import { verifyEmailTemplate } from '../email/templates/verify.email.templates';
export const emailEvent = new EventEmitter();
interface IEmailEventData {
  to: string;
  subject?: string;
  otp: string;
}

emailEvent.on("confirmEmail", async (data: IEmailEventData) => {
     console.log("📩 Event Triggered with data:", data);
    await sendEmail({
      to: data.to,
      subject: data.subject || "confirm-Email",
      html:verifyEmailTemplate({otp:data.otp})
    }).catch((error) => {
      console.log(`Fail to send to ${data.to}`);
    });
})