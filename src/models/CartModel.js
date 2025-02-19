const mongoose = require("mongoose");
const Product = require("./ProductModel");

// Cart Schema
const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: { type: Number, required: true, min: 1 }
      }
    ],
    totalPrice: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Middleware để tính toán tổng giá trước khi lưu giỏ hàng
cartSchema.pre("save", async function (next) {
  try {
    // Lấy thông tin giá trị của từng sản phẩm trong giỏ hàng
    const productsWithPrices = await Promise.all(
      this.products.map(async (item) => {
        const product = await Product.findById(item.productId);

        // Tính giá sản phẩm sau khi áp dụng khuyến mãi hoặc giá gốc sau khi giảm giá
        const price = product
          ? product.promotionPrice ?? product.prices * (1 - (product.discount || 0) / 100)
          : 0;

        return {
          quantity: item.quantity,
          price: price
        };
      })
    );

    // Tính tổng giá trị giỏ hàng
    this.totalPrice = productsWithPrices.reduce((total, product) => {
      return total + product.price * product.quantity;
    }, 0);

    next();
  } catch (error) {
    next(error);
  }
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
