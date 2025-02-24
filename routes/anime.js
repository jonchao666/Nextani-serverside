const express = require("express");
const router = express.Router();
const Anime = require("../models/Anime");
const {
  getNextSeasonAndYear,
  getLastSeasonAndYear,
} = require("../helpers/getSeasonAndYear");
const verifyApiKey = require("../validation");

router.get("/", verifyApiKey, async (req, res) => {
  try {
    // 获取查询参数
    let {
      mal_id,
      type,
      season,
      sortBy,
      genre,
      year,
      yearAndSeason,
      status,
      rating,
      page = 1,
      select = false,
      limit = 18,
      isSensitiveFilterDisabled = "false",
    } = req.query;

    let query = {};
    limit = Number(limit);
    isSensitiveFilterDisabled = isSensitiveFilterDisabled === "true";
    const skip = (page - 1) * limit; // 跳过的文档数

    if (mal_id) {
      if (Array.isArray(mal_id)) {
        query["mal_id"] = mal_id.map((id) => id);
      } else {
        query["mal_id"] = mal_id;
      }
    }
    if (type) {
      query["apiData.type"] = type;
    }
    if (genre) {
      query["apiData.genres.name"] = genre;
    }

    if (year) {
      if (Array.isArray(year)) {
        query["apiData.aired.prop.from.year"] = { $in: year.map((y) => Number(y)) };
      } else {
        query["apiData.aired.prop.from.year"] = Number(year);
      }
    }

    const seasonMonth = { winter: 1, spring: 4, summer: 7, fall: 10 };
    if (season) {
      if (query["apiData.season"] !== null) {
        query["apiData.season"] = season;
      } else {
        query["apiData.aired.prop.from.month"] = seasonMonth[season];
      }
    }

    if (yearAndSeason) {
      if (Array.isArray(yearAndSeason) && yearAndSeason.length > 0) {
        query["$or"] = yearAndSeason.map((ys) => {
          const year = Number(ys[0]);
          const season = ys[1]; // 假设season已经是正确的格式

          return {
            "apiData.aired.prop.from.year": year,
            $or: [
              {
                "apiData.aired.prop.from.month":
                  seasonMonth[season.toLowerCase()],
              }, // 如果你还需要基于月份的过滤
              { "apiData.season": season }, // 直接使用season进行过滤
            ],
          };
        });
      }
    }

    if (status) {
      query["apiData.status"] = status;
    }
    if (isSensitiveFilterDisabled === false) {
      query["apiData.rating"] = { $ne: "Rx - Hentai" };
    } else if (rating) {
      query["apiData.rating"] = rating;
    }

    if (sortBy === "overall") {
      const aggregatePipeline = [
        { $match: query },
        {
          $addFields: {
            weightedScore: {
              $add: [
                {
                  $cond: {
                    if: { $ifNull: ["$apiData.rank", false] },
                    then: { $divide: [1, { $add: ["$apiData.rank", 0.01] }] },
                    else: 0,
                  },
                },
                {
                  $cond: {
                    if: { $ifNull: ["$apiData.popularity", false] },
                    then: {
                      $divide: [1, { $add: ["$apiData.popularity", 0.01] }],
                    },
                    else: 0,
                  },
                },
              ],
            },
          },
        },
        { $sort: { weightedScore: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            "apiData.images.webp.large_image_url": 1,
            "apiData.title": 1,
            "apiData.type": 1,
            "apiData.score": 1,
            "apiData.aired.prop.from.year": 1,
            "apiData.genres.name": 1,
            mal_id: 1,
          },
        },
      ];

      let foundAnimes = await Anime.aggregate(aggregatePipeline);
      res.json(foundAnimes);
    } else {
      let sortCriteria = {};
      switch (sortBy) {
        case "popularity":
          sortCriteria["apiData.members"] = -1;
          break;
        case "score":
          sortCriteria["apiData.score"] = -1;
          break;
      }

      select = select
        ? ""
        : "apiData.images.webp.large_image_url apiData.title apiData.type apiData.score apiData.aired.prop.from.year apiData.genres.name mal_id";

      let foundAnimes = await Anime.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sortCriteria)

        .select(select);

      res.json(foundAnimes);
    }
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ message: "internal server error" });
  }
});

router.get("/search", verifyApiKey, async (req, res) => {
  let {
    query,
    limit,
    page = 1,
    isSensitiveFilterDisabled = "false",
  } = req.query;

  isSensitiveFilterDisabled = isSensitiveFilterDisabled === "true";
  let searchCriteria = {
    "apiData.titles": {
      $elemMatch: {
        title: { $regex: query, $options: "i" },
      },
    },
  };
  if (!isSensitiveFilterDisabled) {
    searchCriteria["apiData.rating"] = { $ne: "Rx - Hentai" };
  }
  const skip = (page - 1) * limit;
  try {
    let foundAnimes = await Anime.find(searchCriteria)
      .skip(skip)
      .sort({ "apiData.popularity": 1 })
      .limit(parseInt(limit) || 10); // Adjust this to select the required fields
    // Optionally, process the results to format them as desired
    let formattedResults = foundAnimes.map((anime) => ({
      mal_id: anime.mal_id,
      apiData: anime.apiData,
      matchedTitles: anime.apiData.titles.filter((titleObj) =>
        titleObj.title.match(new RegExp(query, "i"))
      ),
    }));

    return res.json(formattedResults);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ message: "internal server error" });
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
        mal_id: 1,
      }
    ).sort({ "apiData.status": 1, "apiData.broadcast.time": 1 });

    return res.json(foundAnimes);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/test", verifyApiKey, async (req, res) => {
  const seasonYear = getLastSeasonAndYear();

  try {
    let foundAnimes = await Anime.find({ mal_id: 1 });

    return res.json(foundAnimes);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/recommendations", verifyApiKey, async (req, res) => {
  let {
    mal_id,
    isSensitiveFilterDisabled = "false",
    page = 1,
    limit = 7,
  } = req.query;
  isSensitiveFilterDisabled = isSensitiveFilterDisabled === "true";
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  try {
    const targetAnime = await Anime.findOne({ mal_id: mal_id });
    if (!targetAnime) {
      return res.status(404).json({ message: "Anime not found" });
    }

    const genres = targetAnime.apiData.genres.map((genre) => genre.name);
    const themes = targetAnime.apiData.themes.map((theme) => theme.name);

    let matchStage = {
      $match: {
        mal_id: { $ne: parseInt(mal_id) },
        ...(isSensitiveFilterDisabled
          ? {}
          : { "apiData.rating": { $ne: "Rx - Hentai" } }),
      },
    };

    const recommendations = await Anime.aggregate([
      matchStage,
      {
        $addFields: {
          similarityScore: {
            $add: [
              { $size: { $setIntersection: ["$apiData.genres.name", genres] } },
              { $size: { $setIntersection: ["$apiData.themes.name", themes] } },
            ],
          },
        },
      },
      { $match: { similarityScore: { $gt: 0 } } },
      { $sort: { similarityScore: -1, "apiData.popularity": 1 } },
      { $skip: skip }, // Apply pagination skip
      { $limit: limit }, // Apply pagination limit
      {
        $project: {
          _id: 0,
          mal_id: 1,
          "apiData.images.webp.large_image_url": 1,
          "apiData.title": 1,
          "apiData.score": 1,
          "apiData.genres.name": 1,
          similarityScore: 1,
        },
      },
    ]);

    res.json(recommendations);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
