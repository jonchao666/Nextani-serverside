const express = require("express");
const router = express.Router();
const People = require("../models/People");

const verifyApiKey = require("../validation");

router.get("/", verifyApiKey, async (req, res) => {
  let { mal_id } = req.query;

  let foundPeople = await People.find({ mal_id: mal_id });

  return res.json(foundPeople);
});
module.exports = router;
