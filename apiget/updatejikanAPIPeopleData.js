const axios = require("axios");
const People = require("../models/People");
const Bottleneck = require("bottleneck");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const limiter = new Bottleneck({
  maxConcurrent: 3,
  minTime: 333,
  reservoir: 60,
  reservoirRefreshAmount: 60,
  reservoirRefreshInterval: 60 * 1000,
});

const getJikan = async (page = 1, retries = 3) => {
  try {
    return await limiter.schedule(async () => {
      let result = await axios({
        url: `https://api.jikan.moe/v4/people?limit=25&page=${page}`,
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

const savePeopleToDb = async (peopleData) => {
  const updateData = {};
  Object.keys(peopleData).forEach((key) => {
    updateData[`apiData.${key}`] = peopleData[key];
  });

  try {
    await People.updateOne(
      { mal_id: peopleData.mal_id },
      { $set: updateData },
      { upsert: true }
    );
    console.log(`Saved or updated people ${peopleData.name} in database.`);
  } catch (error) {
    console.error("Error saving or updating people in database:", error);
  }
};

const updatejikanAPIPeopleData = async () => {
  let page = 1;
  const maxRetries = Infinity;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  while (true) {
    console.log(`Fetching page ${page}...`);
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const peoplePage = await getJikan(page);

        if (peoplePage.length === 0) {
          console.log("No more people to fetch. Ending function.");
          return;
        }

        for (const people of peoplePage) {
          console.log(`Saving people ${people.name} to database...`);
          await savePeopleToDb(people);
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

module.exports = updatejikanAPIPeopleData;
