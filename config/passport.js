const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
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
          process.env.ACCESS_TOKEN_SECRET
        );
        return done(null, { user, token: userJwt });
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
