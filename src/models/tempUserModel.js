const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },
  phone: {
    type: Number
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  access_token: { type: String },
  refresh_token: { type: String },
  otpToken: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60
  }
});

module.exports = mongoose.model("TempUser", tempUserSchema, "tempuser");
