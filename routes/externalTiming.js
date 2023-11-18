const express = require("express");
const router = express.Router();
const getAllAnime = require("../apiget/jikanCharAndStaff");
require("dotenv").config();

router.post("/update-anime", async (req, res) => {
  const apiKey = req.header("X-API-KEY");
  if (apiKey !== process.env.UPDATEANIME_SECRET_KEY) {
    return res.status(403).send("Forbidden");
  }

  try {
    await getAllAnime();
    res.status(200).send("Update successful!");
  } catch (error) {
    res.status(500).send("Error updating anime.");
  }
});

module.exports = router;
