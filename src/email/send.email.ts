import nodemailer from "nodemailer";
export async function sendEmail({
  from = process.env.APP_EMAIL,
  to = "",
  cc = "",
  bcc = "",
  subject = "Social App",
  text = "",
  html = "",
  attachments = [],
} = {}) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.APP_EMAIL,
      pass: process.env.APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  const info = await transporter.sendMail({
    from: `"Social App" < ${from}>`,
    to,
    cc,
    bcc,
    subject,
    text,
    html,
    attachments,
  });
  console.log(info.messageId);
}
