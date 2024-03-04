const cron = require("node-cron");
const { exec } = require("child_process");

// Schedule to run updatejikanAPIAnimeData.js every day at 16:00
cron.schedule("0 16 * * *", () => {
  console.log("Running updatejikanAPIAnimeData.js");
  exec("node ./updatejikanAPIAnimeData.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
});

// Schedule to run updatejikanAPIPeopleData.js every day at 16:00
cron.schedule("0 16 * * *", () => {
  console.log("Running updatejikanAPIPeopleData.js");
  exec("node ./updatejikanAPIPeopleData.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
});

console.log("Schedules have been set to run tasks every day at 16:00.");
