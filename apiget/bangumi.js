const axios = require("axios");

const getBangumi = async () => {
  let result = await axios({
    url: "https://api.bgm.tv/v0/subjects/1005",
    method: "GET",
    headers: {
      "User-Agent":
        "trim21/bangumi-episode-ics (https://github.com/Trim21/bangumi-episode-calendar)",
    },
  });
  console.log(result.data);
};
