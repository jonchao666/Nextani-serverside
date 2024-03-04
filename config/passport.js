const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const passport = require("passport");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://nextani-415707.an.r.appspot.com/auth/google/callback",
      session: false,
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        let user = await User.findOne({ "google.id": profile.id });
        if (!user) {
          // 用户不存在，创建新用户
          user = await User.create({
            google: {
              id: profile.id,
              email: profile.emails[0].value,
              displayName: profile.displayName,
              profilePicture: profile.photos[0].value,
            },

            // 设置其他需要的字段...
          });
        } else {
          // 用户已存在，更新用户信息
          user.google.email = profile.emails[0].value;
          user.google.displayName = profile.displayName;
          user.google.profilePicture = profile.photos[0].value;
          // 更新其他需要的字段...

          await user.save(); // 保存更新
        }
        const userJwt = jwt.sign(
          { id: user.id },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "7d",
          }
        );
        return done(null, { user, token: userJwt });
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email });

        if (!user) {
          return done(null, false, { message: "Incorrect email." });
        }
        if (!user.validatePassword(password)) {
          return done(null, false, { message: "Incorrect password." });
        }

        // 用户验证成功，生成 JWT
        const token = jwt.sign(
          { id: user.id }, // 确保这里使用的是用户的唯一标识符
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "7d" } // 设置 token 过期时间为7天
        );

        return done(null, { user, token }); // 将用户信息和 token 一起返回
      } catch (err) {
        return done(err);
      }
    }
  )
);
