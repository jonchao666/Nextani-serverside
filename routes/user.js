const express = require("express");
const { firebaseAdmin } = require("../firebaseConfig");
const router = express.Router();
const User = require("../models/User");

router.get("/", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      user = new User({
        firebaseUid: req.user.uid,
        likedPerson: [],
        likedAnime: [],
        watchlist: [],
        history: [],
        isSensitiveFilterDisabled: false,
      });
    }
    await user.save();

    firebaseAdmin
      .auth()
      .getUser(req.user.uid)
      .then((userRecord) => {
        const userInfo = {
          email: userRecord.email,
          displayName: userRecord.displayName,
          // Use the locally stored profilePicture if it exists; otherwise, use the Firebase photoURL
          profilePicture: user.profilePicture
            ? user.profilePicture
            : userRecord.photoURL
            ? userRecord.photoURL
            : "",
        };
        res.json(userInfo);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        res.status(500).send("Server error");
      });
  } catch (error) {
    console.error("Error fetching user from database:", error);
    res.status(500).send("Server error");
  }
});

//delete account
router.delete("/", async (req, res) => {
  try {
    await User.deleteOne({ firebaseUid: req.user.uid });
    console.log("Delete account from database successfully");
    res.status(204).send();
  } catch (error) {
    console.error("Error delete account:", error);
    res.status(500).send("Server error");
  }
});

router.post("/updateDisplayName", async (req, res) => {
  const { displayName } = req.body;
  firebaseAdmin
    .auth()
    .updateUser(req.user.uid, { displayName })
    .then(() => {
      res.json({ message: "Display name updated successfully", displayName });
    })
    .catch((error) => {
      console.error("Error updating user data:", error);
      res.status(500).send("Server error");
    });
});

router.post("/updateProfilePicture", async (req, res) => {
  try {
    const { profilePictureBase64 } = req.body;
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found");
    }

    user.profilePicture = profilePictureBase64;
    await user.save();

    res.json({
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).send("Server error");
  }
});

router.get("/isSensitiveFilterDisabled", async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      user = new User({
        firebaseUid: req.user.uid,
        likedPerson: [],
        likedAnime: [],
        watchlist: [],
        history: [],
        isSensitiveFilterDisabled: false,
      });
    }
    await user.save();

    let isSensitiveFilterDisabled = user.isSensitiveFilterDisabled;
    res.json({ isSensitiveFilterDisabled: isSensitiveFilterDisabled });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.post("/isSensitiveFilterDisabled", async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).send("User not found");
    }

    let { isSensitiveFilterDisabled } = req.body;

    user.isSensitiveFilterDisabled = isSensitiveFilterDisabled;
    await user.save();

    res.json({ message: "IsSensitiveFilterDisabled updated" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
