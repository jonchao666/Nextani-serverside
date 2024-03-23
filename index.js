require("dotenv").config();
const compression = require("compression");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const authenticateToken = require("./middleware/authenticateToken");
const cors = require("cors");
const PORT = process.env.PORT || 8080;

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
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        /^https:\/\/(\w+\.)?nextani\.net$/,
        /^https:\/\/nextani-2xy0ra37w-jonchao666\.vercel\.app$/,
        /^https:\/\/nextani-phi\.vercel\.app$/,
      ];

      if (process.env.NODE_ENV === "dev") {
        allowedOrigins.push(/^http:\/\/localhost(:\d+)?$/);
      }

      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        return typeof allowedOrigin === "string"
          ? allowedOrigin === origin
          : allowedOrigin.test(origin);
      });

      if (!origin || isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("不允许的跨域请求"), false);
      }
    },
  })
);

app.use(compression());
app.use("/user", authenticateToken);

app.use("/userActivity", authenticateToken);
app.use("/anime", require("./routes/anime"));
app.use("/user", require("./routes/user"));
app.use("/userActivity", require("./routes/userActivity"));
app.use("/people", require("./routes/people"));
app.use("/cron", require("./routes/cron"));

app.get("/", (req, res) => {
  res.send("Hello World");
});
