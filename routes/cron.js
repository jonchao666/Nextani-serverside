const express = require("express");

const router = express.Router();
const updatejikanAPIAnimeData = require("../apiget/updatejikanAPIAnimeData");
const updatejikanAPIPeopleData = require("../apiget/updatejikanAPIPeopleData");

router.get("/updatejikanAPIAnimeData", (req, res) => {
  updatejikanAPIAnimeData();
  res.send("Anime data updated");
});

router.get("/updatejikanAPIPeopleData", (req, res) => {
  updatejikanAPIPeopleData();
  res.send("People data updated");
});

module.exports = router;
