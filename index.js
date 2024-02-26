require("dotenv").config();
const compression = require("compression");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const authenticateToken = require("./middleware/authenticateToken");
const cors = require("cors");
const passport = require("passport");
require("./config/passport");
const updatejikanAPIAnimeData = require("./apiget/updatejikanAPIAnimeData.js");
const updatejikanAPIPeopleData = require("./apiget/updatejikanAPIPeopleData.js");

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
app.use(compression());
app.use("/user", authenticateToken);
app.use("/upload", authenticateToken);
app.use("/userActivity", authenticateToken);
app.use("/profilePicture", express.static("uploads/profilePicture"));

app.use("/auth", require("./routes/auth"));
app.use("/anime", require("./routes/anime"));
app.use("/user", require("./routes/user"));
app.use("/userActivity", require("./routes/userActivity"));

app.use("/upload", require("./routes/upload.js"));
app.use("/external-timing", require("./routes/externalTiming"));

app.get("/", (req, res) => {
  res.send("Hello World");
});

updatejikanAPIAnimeData();
updatejikanAPIPeopleData();
