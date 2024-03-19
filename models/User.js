const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // Firebase UID
  firebaseUid: {
    type: String,
    unique: true,
    required: true,
  },
  profilePicture: {
    type: String,
    default: "",
  },
  // 自定义用户数据
  likedPerson: [Number],
  likedAnime: [Number],
  watchlist: [
    {
      name: String,
      items: [Number],
    },
  ],
  history: [
    {
      mal_id: Number,
      visitedOn: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  isSensitiveFilterDisabled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
