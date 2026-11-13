const nodemailer = require("nodemailer");
const ApiError = require("../utils/apiError");
let transporter = null;
const isConfigured = () => process.env.MAIL_TRANSPORT == "json" || Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);
const getTransporter = () => {
  if (transporter) return transporter;
  if (process.env.MAIL_TRANSPORT == "json") {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE == "true" : port == 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
  return transporter;
};
const sendMail = async ({ to, subject, text, attachments }) => {
  if (!isConfigured()) throw new ApiError(400, "Email is not set up on the server yet");
  return await getTransporter().sendMail({
    from: process.env.MAIL_FROM || "payroll@localhost",
    to,
    subject,
    text,
    attachments
  });
};
module.exports = {
  isConfigured,
  sendMail
}
