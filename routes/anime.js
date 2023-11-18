const express = require("express");
const router = express.Router();
const Anime = require("../models/Anime");
const {
  getNextSeasonAndYear,
  getLastSeasonAndYear,
} = require("../animeHeaplers");
const verifyApiKey = require("../validation");
const getAllAnime = require("../apiget/anilist");

function lowercaseFirstLetter(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

router.get("/thisSeasonPopular", verifyApiKey, async (req, res) => {
  const seasonYear = getLastSeasonAndYear();
  const year = seasonYear[0].year;
  const season = seasonYear[0].season;
  try {
    let foundAnimes = await Anime.find(
      {
        $and: [
          { "apiData.year": year },
          { "apiData.season": season },
          {
            $or: [
              { "apiData.type": "Movie" },
              { "apiData.type": "TV" },
              { "apiData.type": "OVA" },
              { "apiData.type": "Special" },
            ],
          },
        ],
      },
      {
        "apiData.images.webp.large_image_url": 1,
        "apiData.title": 1,
        "apiData.score": 1,
        "apiData.aired.prop.from.year": 1,

        "apiData.genres.name": 1,
      }
    )
      .limit(18)
      .sort("apiData.popularity");

    return res.json(foundAnimes);
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "internal server error" });
  }
});

router.get("/allTimePopular", verifyApiKey, async (req, res) => {
  try {
    let foundAnimes = await Anime.find(
      {
        $or: [
          { "apiData.type": "Movie" },
          { "apiData.type": "TV" },
          { "apiData.type": "OVA" },
          { "apiData.type": "Special" },
        ],
      },
      {
        "apiData.images.webp.large_image_url": 1,
        "apiData.title": 1,
        "apiData.score": 1,
        "apiData.aired.prop.from.year": 1,

        "apiData.genres.name": 1,
      }
    )
      .limit(18)
      .sort({ "apiData.members": -1 });

    return res.json(foundAnimes);
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "internal server error" });
  }
});

router.get("/nextSeason", verifyApiKey, async (req, res) => {
  const nextSeasonYear = getNextSeasonAndYear();
  const year = nextSeasonYear[0].year;
  const season = nextSeasonYear[0].season;
  try {
    let foundAnimes = await Anime.find(
      {
        $and: [
          { "apiData.year": year },
          { "apiData.season": season },
          {
            $or: [
              { "apiData.type": "Movie" },
              { "apiData.type": "TV" },
              { "apiData.type": "OVA" },
              { "apiData.type": "Special" },
            ],
          },
        ],
      },
      {
        "apiData.images.webp.large_image_url": 1,
        "apiData.title": 1,
        "apiData.score": 1,
        "apiData.aired.prop.from.year": 1,

        "apiData.genres.name": 1,
      }
    )
      .limit(18)
      .sort({ "apiData.members": -1 });

    return res.json(foundAnimes);
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "internal server error" });
  }
});

router.get("/topAnime", verifyApiKey, async (req, res) => {
  try {
    let foundAnimes = await Anime.find(
      {
        $or: [
          { "apiData.type": "Movie" },
          { "apiData.type": "TV" },
          { "apiData.type": "OVA" },
          { "apiData.type": "Special" },
        ],
      },
      {
        "apiData.images.webp.large_image_url": 1,
        "apiData.title": 1,
        "apiData.score": 1,
        "apiData.aired.prop.from.year": 1,

        "apiData.genres.name": 1,
      }
    )
      .limit(18)
      .sort({ "apiData.score": -1 });

    return res.json(foundAnimes);
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "internal server error" });
  }
});

//type
router.get("/movie", verifyApiKey, async (req, res) => {
  const nextSeasonYear = getNextSeasonAndYear();
  const year = nextSeasonYear[0].year;
  const season = nextSeasonYear[0].season;
  try {
    let foundAnimes = await Anime.find(
      { "apiData.type": "Movie" },
      {
        "apiData.images.webp.large_image_url": 1,
        "apiData.title": 1,
        "apiData.score": 1,
        "apiData.aired.prop.from.year": 1,

        "apiData.genres.name": 1,
      }
    )
      .limit(18)
      .sort({ "apiData.members": -1 });

    return res.json(foundAnimes);
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "internal server error" });
  }
});

router.get("/music", verifyApiKey, async (req, res) => {
  const nextSeasonYear = getNextSeasonAndYear();
  const year = nextSeasonYear[0].year;
  const season = nextSeasonYear[0].season;
  try {
    let foundAnimes = await Anime.find(
      { "apiData.type": "Music" },
      {
        "apiData.images.webp.large_image_url": 1,
        "apiData.title": 1,
        "apiData.score": 1,
        "apiData.aired.prop.from.year": 1,

        "apiData.genres.name": 1,
      }
    )
      .limit(18)
      .sort({ "apiData.members": -1 });

    return res.json(foundAnimes);
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "internal server error" });
  }
});

//genres
router.get("/genres/:genre", verifyApiKey, async (req, res) => {
  const genre = req.params.genre;
  try {
    let foundAnimes = await Anime.find(
      {
        $and: [
          { "apiData.genres.name": genre },

          {
            $or: [
              { "apiData.type": "Movie" },
              { "apiData.type": "TV" },
              { "apiData.type": "OVA" },
              { "apiData.type": "Special" },
            ],
          },
        ],
      },
      {
        "apiData.images.webp": 1,
        "apiData.title": 1,
        "apiData.score": 1,
        "apiData.aired.prop.from.year": 1,

        "apiData.genres.name": 1,
      }
    )
      .limit(18)
      .sort({ "apiData.members": -1 });

    return res.json(foundAnimes);
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "internal server error" });
  }
});

//directors
router.get("/directors/:director", verifyApiKey, async (req, res) => {
  const director = req.params.director;
  try {
    let foundAnimes = await Anime.find(
      {
        "apiData.staff": {
          $elemMatch: {
            "person.name": director,
            positions: "Director",
          },
        },
        "apiData.type": { $in: ["Movie", "TV", "OVA", "Special"] },
      },
      {
        "apiData.images.webp.large_image_url": 1,
        "apiData.title": 1,
        "apiData.score": 1,
        "apiData.aired.prop.from.year": 1,

        "apiData.genres.name": 1,
      }
    )
      .limit(18)
      .sort({ "apiData.members": -1 });

    return res.json(foundAnimes);
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ message: "internal server error" });
  }
});
//calendar
router.get("/calendar", verifyApiKey, async (req, res) => {
  const seasonYear = getLastSeasonAndYear();
  const year = seasonYear[0].year;

  const week = req.query.week + "s";

  try {
    let foundAnimes = await Anime.find(
      {
        $and: [
          { "apiData.status": { $in: ["Currently Airing", "Not yet aired"] } },
          { "apiData.broadcast.day": week },
          {
            $or: [
              { "apiData.type": "Movie" },
              { "apiData.type": "TV" },
              { "apiData.type": "OVA" },
              { "apiData.type": "Special" },
            ],
          },
          { "apiData.year": year },
        ],
      },
      {
        "apiData.images.webp.large_image_url": 1,
        "apiData.title": 1,
        "apiData.score": 1,
        "apiData.aired.prop.from.year": 1,
        "apiData.broadcast.time": 1,
        "apiData.genres.name": 1,
      }
    ).sort({ "apiData.status": 1, "apiData.broadcast.time": 1 });

    return res.json(foundAnimes);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/test", verifyApiKey, async (req, res) => {
  const week = req.query.week;
  const seasonYear = getLastSeasonAndYear();
  const year = seasonYear[0].year;
  const season = seasonYear[0].season;

  try {
    let foundAnimes = await Anime.find({}).limit(2);

    return res.json(foundAnimes);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});
module.exports = router;
