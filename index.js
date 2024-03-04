require("dotenv").config();
const compression = require("compression");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const authenticateToken = require("./middleware/authenticateToken");
const cors = require("cors");
const PORT = process.env.PORT || 8080;
const passport = require("passport");
require("./config/passport");
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const maxRetryAttempts = 5;
const retryDelay = 1000;
let retryAttempts = 0;

const connectWithRetry = () => {
  console.log(
    "Attempting MongoDB connection (attempt " +
      (retryAttempts + 1) +
      "/" +
      maxRetryAttempts +
      ")..."
  );
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log("Database connected");
    })
    .catch((err) => {
      console.error("MongoDB connection unsuccessful, retrying...", err);
      retryAttempts++;
      if (retryAttempts < maxRetryAttempts) {
        setTimeout(
          connectWithRetry,
          retryDelay * Math.pow(2, retryAttempts - 1)
        );
      } else {
        console.error(
          "Failed to connect to MongoDB after " +
            maxRetryAttempts +
            " attempts."
        );
      }
    });
};

connectWithRetry();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// app.use(cors({ origin: 'https://www.nextani.net' }));
app.use(compression());
app.use("/user", authenticateToken);
app.use("/upload", authenticateToken);
app.use("/userActivity", authenticateToken);
app.use("/profilePicture", express.static("uploads/profilePicture"));

app.use("/auth", require("./routes/auth"));
app.use("/anime", require("./routes/anime"));
app.use("/user", require("./routes/user"));
app.use("/userActivity", require("./routes/userActivity"));
app.use("/people", require("./routes/people"));
app.use("/cron", require("./routes/cron"));

app.use("/upload", require("./routes/upload.js"));

app.get("/", (req, res) => {
  res.send("Hello World");
});
