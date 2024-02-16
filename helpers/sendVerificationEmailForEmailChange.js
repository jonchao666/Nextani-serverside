const nodemailer = require("nodemailer");
const User = require("../models/User");
const crypto = require("crypto");
const sendVerificationEmailForEmailChange = async (newEmail, userId) => {
  const user = await User.findById(userId);
  const token = crypto.randomBytes(48).toString("hex");

  if (!user) {
    throw new Error("User not found");
  }

  user.updateEmailToken = token;

  await user.save();

  let transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME, // 你的 Gmail 账号
      pass: process.env.EMAIL_PASSWORD, // 你的 Gmail 密码或应用密码
    },
  });

  // 邮件内容配置
  let mailOptions = {
    from: process.env.EMAIL_USERNAME, // 发送者邮箱
    to: newEmail, // 接收者邮箱，即用户的新邮箱地址
    subject: "NextAni Email Change Verification", // 邮件主题
    html: `<p>Hello,<br/> We have received a request to change your NextAni account email address.<br/>To complete the email change process, please click the link below:</p>
    <a href="${process.env.SITE_URL}/email-changed?email=${newEmail}&token=${token}">${process.env.SITE_URL}/email-changed?email=${newEmail}&token=${token}</a>`, // HTML邮件内容
  };

  // 发送邮件
  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: " + error);
  }
};
module.exports = sendVerificationEmailForEmailChange;
