const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String, required: true },
  tokenExpires: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

tempUserSchema.index({ tokenExpires: 1 }, { expireAfterSeconds: 3600 });

const TempUser = mongoose.model("TempUser", tempUserSchema);

module.exports = TempUser;
