const express = require("express");
const multer = require("multer");
const User = require("../models/User");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profilePicture");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

const upload = multer({ storage: storage });

// 添加上传路由
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // 获取用户
    if (!user) {
      return res.status(404).send("User not found");
    }
    //delete old profilePicture file
    if (user.profilePicture) {
      const filename = user.profilePicture.split("/").pop();

      const oldPath = path.join(
        __dirname,
        "../uploads/profilePicture",
        filename
      );

      if (fs.existsSync(oldPath)) {
        fs.unlink(oldPath, (err) => {
          if (err) {
            console.error("Failed to delete old profile picture: ", err);
          }
        });
      }
    }

    user.profilePicture = "/profilePicture/" + req.file.filename;
    await user.save();

    res.json({
      message: "File uploaded successfully",
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

module.exports = router;
