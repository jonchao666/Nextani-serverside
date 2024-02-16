const nodemailer = require("nodemailer");

const sendVerificationEmailForSignUp = async (email, token) => {
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
    to: email, //
    subject: "NextAni Sign Up Verification",
    html: `<p>Hello,<br/> We have received a request to sign up NextAni account.<br/>To complete the sign up process, please click the link below:</p>
    <a href="${process.env.SITE_URL}/signup-success?token=${token}">${process.env.SITE_URL}/signup-success?token=${token}</a>`, // HTML邮件内容
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: " + error);
  }
};
module.exports = sendVerificationEmailForSignUp;
