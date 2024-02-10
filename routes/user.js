const express = require("express");

const router = express.Router();
const User = require("../models/User");
const xss = require("xss");

//get user information
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    let userInfo = {
      email: user.email,
      displayName: user.displayName,
      profilePicture: user.profilePicture || "",
      google: {
        email: user.email || user.google.email,
        displayName: user.displayName || user.google.displayName,
        profilePicture: user.profilePicture || user.google.profilePicture || "",
      },
      microsoft: {
        email: user.email || user.microsoft.email,
        displayName: user.displayName || user.microsoft.displayName,
        profilePicture:
          user.profilePicture || user.microsoft.profilePicture || "",
      },
      apple: {
        email: user.email || user.apple.email,
        displayName: user.displayName || user.apple.displayName,
        profilePicture: user.profilePicture || user.apple.profilePicture || "",
      },
    };

    res.json(userInfo);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

//updateDisplayName
router.post("/updateDisplayName", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // 从请求体中获取新的 displayName
    const { displayName } = req.body;
    const clearedDisplayName = xss(displayName.trim());

    if (!displayName) {
      return res.status(400).send("Display name is required");
    }

    // 更新用户的 displayName
    user.displayName = clearedDisplayName;
    await user.save();

    res.json({
      message: "Display name updated successfully",
      displayName: user.displayName,
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

//verifyEmail change
const sendVerificationEmailForEmailChange = require("../helpers/sendVerificationEmailForEmailChange");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/verifyEmail", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const { email } = req.body;
    const clearedEmail = xss(email.trim());

    if (!email) {
      return res.status(400).send("Email is required");
    }

    if (!emailRegex.test(email)) {
      return res.status(400).send("Invalid email format");
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).send("Email already in use");
    }

    sendVerificationEmailForEmailChange(clearedEmail, req.user.id);

    res.json({
      message:
        "Verification email sent successfully. Please check your email to confirm the update.",
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

//updateEmail
router.post("/updateEmail", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // 从请求体中获取新的 displayName
    const { email, token } = req.body;
    const clearedEmail = xss(email.trim());
    if (!email) {
      return res.status(400).send("email is required");
    }

    if (user.updateEmailToken !== token) {
      return res.status(400).send("error verification");
    }
    user.updateEmailToken = null;
    // 更新用户的 displayName
    user.email = clearedEmail;
    await user.save();

    res.json({
      message: "Email updated successfully",
      email: user.clearedEmail,
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

//checkEmailUpdated
router.post("/checkEmailUpdated", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { email } = req.body;

    if (!user) {
      return res.status(404).send("User not found");
    }

    if (email === user.email) {
      res.json({ emailUpdated: true });
    } else {
      res.json({ emailUpdated: false });
    }
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//delete account
router.post("/deleteAccount", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const { token } = req.body;

    if (user.deleteAccountToken !== token) {
      return res.status(400).send("error verification");
    }

    await User.findByIdAndRemove(req.user.id);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
});

//verifyAccountDelete
const sendVerificationEmailForAccountDelete = require("../helpers/sendVerificationEmailForAccountDelete");

router.get("/verifyDeleteAccount", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    sendVerificationEmailForAccountDelete(req.user.id);

    res.json({
      message:
        "Verification email sent successfully. Please check your email to confirm the update.",
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

router.get("/checkAccountDeleted", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      res.json({ accountDeleted: true });
    } else {
      res.json({ accountDeleted: false });
    }
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
