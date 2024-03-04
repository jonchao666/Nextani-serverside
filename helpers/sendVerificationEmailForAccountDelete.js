const nodemailer = require("nodemailer");
const User = require("../models/User");
const crypto = require("crypto");
const sendVerificationEmailForAccountDelete = async (userId) => {
  const user = await User.findById(userId);
  const token = crypto.randomBytes(48).toString("hex");

  if (!user) {
    throw new Error("User not found");
  }

  user.deleteAccountToken = token;
  let email = user.email || user.google.email;
  await user.save();

  let transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  let mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: "NextAni User Account Deletation Confirmation",
    html: `<p>Hello,<br/> We have received a request to delete your NextAni account and all of its associated data.<br/>To complete the deletion your account, please click the link below:</p>
    <a href="${process.env.SITE_URL}/account-deleted?&token=${token}">${process.env.SITE_URL}/account-deleted?&token=${token}</a>`, // HTML邮件内容
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: " + error);
  }
};
module.exports = sendVerificationEmailForAccountDelete;
