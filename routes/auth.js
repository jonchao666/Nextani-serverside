const express = require("express");
const passport = require("passport");
const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    res.redirect(
      `http://localhost:3000/auth-callback/?token=${req.user.token}`
    );
  }
);

module.exports = router;
