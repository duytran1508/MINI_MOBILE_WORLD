const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true, min: 1, max: 100 }
  },
  { timestamps: true }
);

const Voucher = mongoose.model("Voucher", voucherSchema);
module.exports = Voucher;
