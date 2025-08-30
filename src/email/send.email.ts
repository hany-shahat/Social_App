import { createTransport, Transporter } from "nodemailer"
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport"
import { badRequestException } from "../utils/response/error.response";
export const sendEmail = async (data: Mail.Options): Promise<void> => {
  if (!data.html && !data.attachments?.length && !data.text) {
    throw new badRequestException("Missing email content")
  }
  const transporter: Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options> = createTransport({
    service:"gmail",
    auth: {
      user: process.env.APP_EMAIL as string,
      pass: process.env.APP_PASSWORD as string,
    },
    tls: {
    rejectUnauthorized: false
  },
  });
  const info = await transporter.sendMail({
    ...data,
    from:  `"Social App" <${process.env.APP_EMAI as string}>`,
  });
  console.log("Message Send" ,info.messageId);
  
}