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
  const updateData = {};
  Object.keys(animeData).forEach((key) => {
    if (key !== "characters" && key !== "staff" && key !== "recommendations") {
      // 排除不想更新的字段
      updateData[`apiData.${key}`] = animeData[key];
    }
  });

  try {
    await Anime.updateOne(
      { mal_id: animeData.mal_id },
      { $set: updateData },
      { upsert: true }
    );
    console.log(`Saved or updated anime ${animeData.title} in database.`);
  } catch (error) {
    console.error("Error saving or updating anime in database:", error);
  }
};

const updatejikanAPIData = async () => {
  let page = 1;
  const maxRetries = Infinity; // 设置最大重试次数
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  while (true) {
    console.log(`Fetching page ${page}...`);
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const animePage = await getJikan(page);

        if (animePage.length === 0) {
          console.log("No more anime to fetch. Ending function.");
          return; // 没有更多的数据时退出整个函数
        }

        for (const anime of animePage) {
          console.log(`Saving anime ${anime.title} to database...`);
          await saveAnimeToDb(anime);
        }

        page++; // 成功获取数据，递增页面号并跳出重试循环
        break;
      } catch (error) {
        console.error(`Error fetching page ${page}: ${error}`);
        retries++;
        if (retries >= maxRetries) {
          console.error(`Max retries reached for page ${page}. Skipping.`);
          break; // 达到最大重试次数，跳过当前页面
        }
        console.log(`Retrying page ${page}... Attempt ${retries}`);
        await sleep(10000); // 等待一段时间后重试
      }
    }
  }
};

module.exports = updatejikanAPIData;
