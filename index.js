require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const anime = require("./routes/anime");
const cors = require("cors");
const externalTiming = require("./routes/externalTiming");
const getAllAnime1 = require("./apiget/jikanwithoutCharAndStaff");
const getAllAnime = require("./apiget/jikanCharAndStaff");

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});

const connectWithRetry = () => {
  console.log("MongoDB connection with retry");
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of the default 30s
    })
    .then(() => {
      console.log("Database connected");
    })
    .catch((err) => {
      console.error(
        "MongoDB connection unsuccessful, retry after 5 seconds.",
        err
      );
      setTimeout(connectWithRetry, 5000); // Wait 5 seconds then retry
    });
};

connectWithRetry(); // Start the initial connectionnodemon

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/anime", anime);
app.use("/external-timing", externalTiming);

app.get("/", (req, res) => {
  res.send("Hello World");
});
