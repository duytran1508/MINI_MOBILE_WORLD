const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
}, { timestamps: true });

const Shop = mongoose.model("Shop", shopSchema);
module.exports = Shop;
