const { request } = require("graphql-request");
const Anime = require("../models/Anime");
const Bottleneck = require("bottleneck");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const limiter = new Bottleneck({
  maxConcurrent: 3,
  minTime: 1000,
});

const getAnilist = async (page = 1, retries = 3) => {
  const query = `
      query ($page: Int) {
        Page (page: $page, perPage: 25) {
          media(type: ANIME) {  # 添加type参数以筛选ANIME
            id
            title {
              romaji
              english
              native
            }
            airingSchedule {
              nodes {
                airingAt
                timeUntilAiring
                episode
              }
            }
            coverImage {
              extraLarge
              large
              medium
              color
            }
          }
        }
      }
    `;

  const variables = {
    page,
  };

  try {
    return await limiter.schedule(async () => {
      let result = await request(
        "https://graphql.anilist.co",
        query,
        variables
      );
      return result.Page.media;
    });
  } catch (error) {
    if (
      error.response &&
      error.response.errors &&
      error.response.errors.some((e) => e.message.includes("rate-limited")) &&
      retries > 0
    ) {
      console.log("Rate limited. Retrying in 10 seconds...");
      await sleep(10000);
      return getAnilist(page, retries - 1);
    } else {
      throw error;
    }
  }
};

const saveAnimeToDb = async (animeData) => {
  try {
    // 从animeData对象中提取标题字段
    const titleEnglish = animeData.title.english;
    const titleJapanese = animeData.title.native;

    // 查找与给定英文标题或日文标题匹配的记录
    const existingRecord = await Anime.findOne({
      $or: [
        { "apiData.title_english": titleEnglish },
        { "apiData.title_japanese": titleJapanese },
      ],
    });

    // 如果找到了匹配的记录，则更新该记录
    if (existingRecord) {
      await Anime.updateOne(
        { _id: existingRecord._id },
        { apiData: animeData }
      );
      console.log(
        `Updated anime ${titleEnglish || titleJapanese} in database.`
      );
    } else {
      // 如果没有找到匹配的记录，则不执行任何操作
      console.log(
        `No matching record found for anime ${
          titleEnglish || titleJapanese
        }. Not inserting.`
      );
    }
  } catch (error) {
    console.error("Error saving or updating anime in database:", error);
  }
};

const getAllAnime = async () => {
  let page = 775;
  while (true) {
    console.log(`Fetching page ${page}...`);
    const animePage = await getAnilist(page);
    if (animePage.length === 0) {
      console.log("No more anime to fetch. Ending function.");
      break;
    }
    for (const anime of animePage) {
      console.log(
        `Saving anime ${
          anime.title.english || anime.title.romaji || anime.title.native
        } to database...`
      );
      await saveAnimeToDb(anime);
    }
    page++;
  }
};

module.exports = getAllAnime;
