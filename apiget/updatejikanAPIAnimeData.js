const axios = require("axios");
const Anime = require("../models/Anime");
const Bottleneck = require("bottleneck");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const limiter = new Bottleneck({
  maxConcurrent: 3,
  minTime: 333,
  reservoir: 60,
  reservoirRefreshAmount: 60,
});

const getJikan = async (page = 1, retries = 3) => {
  try {
    return await limiter.schedule(async () => {
      let result = await axios({
        url: `https://api.jikan.moe/v4/anime?limit=25&page=${page}`,
        method: "GET",
      });
      return result.data.data;
    });
  } catch (error) {
    if (
      error.response &&
      error.response.data.message.includes("rate-limited") &&
      retries > 0
    ) {
      console.log("Rate limited. Retrying in 10 seconds...");
      await sleep(10000);
      return getJikan(page, retries - 1);
    } else {
      throw error;
    }
  }
};

const saveAnimeToDb = async (animeData) => {
  try {
    await Anime.updateOne(
      { mal_id: animeData.mal_id },
      { $set: { apiData: animeData } },
      { upsert: true }
    );
    console.log(`Saved or updated anime ${animeData.title} in database.`);
  } catch (error) {
    console.error("Error saving or updating anime in database:", error);
  }
};

const updatejikanAPIAnimeData = async () => {
  let page = 1;
  const maxRetries = Infinity;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  while (true) {
    console.log(`Fetching page ${page}...`);
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const animePage = await getJikan(page);

        if (animePage.length === 0) {
          console.log("No more anime to fetch. Ending function.");
          return;
        }

        for (const anime of animePage) {
          console.log(`Saving anime ${anime.title} to database...`);
          await saveAnimeToDb(anime);
        }

        page++;
        break;
      } catch (error) {
        console.error(`Error fetching page ${page}: ${error}`);
        retries++;
        if (retries >= maxRetries) {
          console.error(`Max retries reached for page ${page}. Skipping.`);
          break;
        }
        console.log(`Retrying page ${page}... Attempt ${retries}`);
        await sleep(10000);
      }
    }
  }
};

module.exports = updatejikanAPIAnimeData;
