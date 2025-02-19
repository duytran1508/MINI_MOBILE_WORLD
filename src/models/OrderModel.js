const mongoose = require("mongoose");

// Hàm chuyển đổi giờ UTC sang giờ Việt Nam
const toVietnamTime = (date) => {
  const vietnamOffset = 7; // GMT+7
  const localDate = new Date(date.getTime() + vietnamOffset * 60 * 60 * 1000);
  return localDate;
};

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: { type: Number, required: true }
      }
    ],
    shippingAddress: { type: String },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    totalPrice: { type: Number },
    shippingFee: { type: Number, default: 0 },
    VAT: { type: Number, default: 0 },
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher"
    },
    orderTotal: { type: Number },
    status: {
      type: String,
      enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
      default: "Pending"
    },
    isPaid: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Middleware để chuyển đổi thời gian sang GMT+7
orderSchema.pre("save", function (next) {
  if (this.isNew) {
    this.createdAt = toVietnamTime(new Date());
  }
  this.updatedAt = toVietnamTime(new Date());
  next();
});

// Middleware cho `findOneAndUpdate`
orderSchema.pre("findOneAndUpdate", function (next) {
  this._update.updatedAt = toVietnamTime(new Date());
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
