const axios = require("axios");
const Anime = require("../models/Anime");
const Bottleneck = require("bottleneck");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const limiter = new Bottleneck({
  maxConcurrent: 3, // 每秒最多 3 个并发请求
  minTime: 333, // 每 333 毫秒一个请求，确保每秒不超过 3 个请求
  reservoir: 60, // 每分钟最多 60 个请求
  reservoirRefreshAmount: 60,
  reservoirRefreshInterval: 60 * 1000, // 每分钟刷新一次
  // 这里不需要 highWaterMark 和 strategy，因为我们不在乎队列的长度
});

const getJikan = async (page = 1, retries = 3) => {
  try {
    return await limiter.schedule(async () => {
      let result = await axios({
        url: `https://api.jikan.moe/v4/anime?limit=25&page=${page}`,
        method: "GET",
        timeout: 10000, // 10秒超时
      });
      return result.data.data;
    });
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      console.log(`Request timed out. Retrying page ${page}...`);
      return getJikan(page, retries - 1);
    } else if (
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

const getAnimeCharacters = async (mal_id, retries = 3) => {
  try {
    return await limiter.schedule(async () => {
      const result = await axios.get(
        `https://api.jikan.moe/v4/anime/${mal_id}/characters`,
        { timeout: 10000 } // 10秒超时
      );
      return result.data.data;
    });
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      console.log(
        `Request timed out for characters of mal_id ${mal_id}. Retrying...`
      );
      return getAnimeCharacters(mal_id, retries - 1);
    } else if (error.response && error.response.status === 429 && retries > 0) {
      console.log("Rate limited. Retrying in 10 seconds...");
      await sleep(10000);
      return getAnimeCharacters(mal_id, retries - 1);
    } else {
      console.error(
        `Error fetching characters for mal_id ${mal_id}: ${error.message}`
      );
      return null;
    }
  }
};

const getAnimeStaff = async (mal_id, retries = 3) => {
  try {
    return await limiter.schedule(async () => {
      const result = await axios.get(
        `https://api.jikan.moe/v4/anime/${mal_id}/staff`,
        { timeout: 10000 } // 10秒超时
      );
      return result.data.data;
    });
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      console.log(
        `Request timed out for staff of mal_id ${mal_id}. Retrying...`
      );
      return getAnimeStaff(mal_id, retries - 1);
    } else if (error.response && error.response.status === 429 && retries > 0) {
      console.log("Rate limited. Retrying in 10 seconds...");
      await sleep(10000);
      return getAnimeStaff(mal_id, retries - 1);
    } else {
      console.error(
        `Error fetching staff for mal_id ${mal_id}: ${error.message}`
      );
      return null;
    }
  }
};

const saveAnimeToDb = async (animeData) => {
  try {
    await Anime.updateOne(
      { mal_id: animeData.mal_id },
      { apiData: animeData },
      { upsert: true }
    );
    console.log(`Saved or updated anime ${animeData.title} in database.`);
  } catch (error) {
    console.error("Error saving or updating anime in database:", error);
  }
};

const getAllAnime = async () => {
  let page = 189;
  const maxRetries = Infinity; // 设置最大重试次数

  while (true) {
    console.log(`Fetching page ${page}...`);
    const animePage = await getJikan(page);

    if (animePage.length === 0) {
      console.log("No more anime to fetch. Ending function.");
      break;
    }

    for (const anime of animePage) {
      let retries = 0;
      while (retries < maxRetries) {
        try {
          console.log(`Fetching characters and staff for ${anime.title}...`);
          const characters = await getAnimeCharacters(anime.mal_id);
          const staff = await getAnimeStaff(anime.mal_id);

          const completeAnimeData = {
            ...anime,
            characters: characters || [],
            staff: staff || [],
          };
          await saveAnimeToDb(completeAnimeData);
          break; // 成功获取到数据，跳出重试循环
        } catch (error) {
          console.error(`Failed to fetch data for ${anime.title}: ${error}`);
          retries++;
          if (retries >= maxRetries) {
            console.error(`Max retries reached for ${anime.title}. Skipping.`);
            break; // 达到最大重试次数，跳过当前动漫
          }
          console.log(`Retrying ${anime.title}... Attempt ${retries}`);
          await sleep(10000); // 等待一段时间后重试
        }
      }
    }

    page++;
  }
};

module.exports = getAllAnime;
