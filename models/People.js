const mongoose = require("mongoose");
const { Schema } = mongoose;

const animeSchema = new Schema({
  mal_id: { type: Number, unique: true, required: true },
  apiData: Object,
});

module.exports = mongoose.model("People", animeSchema);
