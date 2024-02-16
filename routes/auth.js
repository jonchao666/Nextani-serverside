const express = require("express");
const passport = require("passport");
const router = express.Router();
require("dotenv").config();
const User = require("../models/User");
const TempUser = require("../models/TempUser");
const crypto = require("crypto");
const sendVerificationEmailForSignUp = require("../helpers/sendVerificationEmailForSignUp");

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    res.redirect(
      `${process.env.SITE_URL}/auth-callback/?token=${req.user.token}`
    );
  }
);

router.post("/localLogin", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ error: info.message });
    }

    return res.json({ token: user.token });
  })(req, res, next);
});

router.post("/localVerifyEmail", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 检查正式用户中是否已存在该电子邮件
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Email already exists.");
    }

    const validatePassword = (password) => {
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(password);
    };
    if (!validatePassword(password)) {
      return res
        .status(400)
        .send(
          "Password must be at least 8 characters long, include numbers, uppercase and lowercase letters."
        );
    }
    const token = crypto.randomBytes(48).toString("hex");

    let tempUser = await TempUser.findOne({ email });
    if (tempUser) {
      // 如果存在，更新 token 和 tokenExpires
      tempUser.token = token;
      tempUser.tokenExpires = new Date(Date.now() + 3600000); // 重新设置token过期时间
    } else {
      // 如果不存在，创建一个新的 TempUser 实例，密码将在保存时自动加密
      tempUser = new TempUser({
        email,
        password, // 直接赋值，pre("save") 钩子会处理加密
        token,
        tokenExpires: new Date(Date.now() + 3600000), // 设置token过期时间
      });
    }
    await tempUser.save();

    // 发送验证邮件
    await sendVerificationEmailForSignUp(email, token);

    res.status(201).json({
      message: "Please verify your email to complete registration.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

router.post(
  "/localSignUp",

  async (req, res) => {
    try {
      const { token } = req.body;

      const tempUser = await TempUser.findOne({ token: token });
      if (!tempUser) {
        return res.status(400).send("Invalid or expired token.");
      }

      const password = tempUser.password;
      const email = tempUser.email;

      const user = await User.findOne({ email: email });
      if (user) {
        return res.status(400).send("Email already in use");
      } else {
        await User.create({
          local: {
            password: password,
          },
          email: email,
        });
      }

      return res.json({ message: "Sign up successfully." });
    } catch (error) {
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
