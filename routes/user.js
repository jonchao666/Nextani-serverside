const express = require("express");

const router = express.Router();
const User = require("../models/User");

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

    if (!displayName) {
      return res.status(400).send("Display name is required");
    }

    // 更新用户的 displayName
    user.displayName = displayName;
    await user.save();

    res.json({
      message: "Display name updated successfully",
      displayName: user.displayName,
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

//verifyEmail
const sendVerificationEmail = require("../helpers/sendVerificationEmail");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/verifyEmail", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const { email } = req.body;

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

    sendVerificationEmail(email, req.user.id);

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

    if (!email) {
      return res.status(400).send("email is required");
    }

    if (user.updateEmailToken !== token) {
      return res.status(400).send("error verification");
    }
    user.updateEmailToken = null;
    // 更新用户的 displayName
    user.email = email;
    await user.save();

    res.json({
      message: "Email updated successfully",
      email: user.email,
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
router.get("/deleteAccount", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    await User.findByIdAndRemove(req.user.id);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).send("Server error: " + error.message);
  }
});

module.exports = router;
