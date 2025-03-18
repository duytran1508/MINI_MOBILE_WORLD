const Cart = require("../models/CartModel");
const Product = require("../models/ProductModel");
const Shop = require("../models/ShopModel");

const addOrUpdateProductInCart = async (userId, productId, quantity) => {
  try {
    // Lấy sản phẩm từ database
    const product = await Product.findById(productId);
    if (!product) {
      throw { status: 404, message: "Product not found" };
    }

    // Kiểm tra xem số lượng sản phẩm trong kho có đủ không
    if (quantity > product.quantityInStock) {
      throw {
        status: 400,
        message: `Not enough stock for ${product.name}. Available: ${product.quantityInStock}`
      };
    }

    // Lấy giỏ hàng hiện tại của người dùng
    const existingCart = await Cart.findOne({ userId });
    const cart =
      existingCart ||
      new Cart({
        userId,
        products: []
      });

    // Tìm sản phẩm trong giỏ hàng
    // Tìm sản phẩm trong giỏ hàng nhưng phải cùng shop
const productIndex = cart.products.findIndex(
  (p) =>
    p.productId.toString() === productId.toString() &&
    p.shopId.toString() === product.shopId.toString() // Kiểm tra shopId
);

if (productIndex > -1) {
  // Sản phẩm đã có trong giỏ hàng cùng shop => Cập nhật số lượng
  const newQuantity = cart.products[productIndex].quantity + quantity;

  // Kiểm tra số lượng có vượt quá kho không
  if (newQuantity > product.quantityInStock) {
    throw {
      status: 400,
      message: `Not enough stock for ${product.name}. Available: ${product.quantityInStock}`
    };
  }

  cart.products[productIndex].quantity = newQuantity;
} else {
  // Sản phẩm chưa có trong giỏ hoặc có nhưng từ shop khác => Thêm sản phẩm mới
  cart.products.push({ productId, quantity, shopId: product.shopId });
}
    // Tính toán lại tổng giá trị giỏ hàng
    cart.totalPrice = await cart.products.reduce(
      async (totalPromise, productItem) => {
        const total = await totalPromise;
        const productInDB = await Product.findById(productItem.productId);
        const productPrice = productInDB
          ? productInDB.promotionPrice ?? productInDB.prices
          : 0;
    
        return (
          total +
          (isNaN(productPrice) || productPrice < 0
            ? 0
            : productPrice * productItem.quantity)
        );
      },
      Promise.resolve(0)
    );

    // Lưu giỏ hàng
    await cart.save();
    const populatedCart = await Cart.findById(cart._id).populate(
      "products.productId"
    );
    return populatedCart;
  } catch (error) {
    console.error("Error in addOrUpdateProductInCart service:", error);
    throw { status: 500, message: "Internal server error" };
  }
};

const UpdateProductInCart = async (userId, productId, quantity) => {
  try {
    // Tìm giỏ hàng của người dùng
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw { status: 404, message: "Cart not found" };
    }

    // Tìm sản phẩm trong giỏ hàng
    const productIndex = cart.products.findIndex(
      (p) => p.productId.toString() === productId.toString()
    );

    if (productIndex === -1) {
      throw { status: 404, message: "Product not found in cart" };
    }

    // Giảm số lượng sản phẩm xuống 1 đơn vị
    if (cart.products[productIndex].quantity > 1) {
      cart.products[productIndex].quantity -= 1;
    } else {
      throw { status: 400, message: "Cannot decrease quantity below 1" };
    }

    // Tính toán lại tổng giá (`totalPrice`)
    cart.totalPrice = await cart.products.reduce(
      async (totalPromise, productItem) => {
        const total = await totalPromise;
        const productInDB = await Product.findById(productItem.productId);
        const productPrice = productInDB
          ? productInDB.promotionPrice ?? productInDB.prices
          : 0;
    
        return (
          total +
          (isNaN(productPrice) || productPrice < 0
            ? 0
            : productPrice * productItem.quantity)
        );
      },
      Promise.resolve(0)
    );

    // Lưu giỏ hàng
    await cart.save();

    // Populate thông tin sản phẩm và trả về
    const populatedCart = await Cart.findById(cart._id).populate(
      "products.productId"
    );

    return populatedCart;
  } catch (error) {
    console.error("Error in DecreaseProductQuantity service:", error);
    throw { status: 500, message: "Internal server error" };
  }
};

const getCartByUserId = async (userId) => {
  try {
    const cart = await Cart.findOne({ userId }).populate("products.productId");

    if (!cart) {
      throw { status: 404, message: "Cart not found" };
    }

    // Nhóm sản phẩm theo shopId
    const groupedByShop = cart.products.reduce((acc, item) => {
      const shopId = item.shopId.toString();
      if (!acc[shopId]) acc[shopId] = [];
      acc[shopId].push(item);
      return acc;
    }, {});

    return groupedByShop; // Trả về danh sách sản phẩm đã nhóm theo shop
  } catch (error) {
    console.error("Error in getCartByUserId:", error);
    throw { status: 500, message: "Internal server error" };
  }
};

const removeProductFromCart = async (userId, productId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cart = await Cart.findOne({ userId }).populate(
        "products.productId",
        "name prices"
      );
      if (!cart) {
        return resolve({
          status: "ERR",
          message: "Cart not found"
        });
      }

      const productExists = cart.products.some(
        (p) => p.productId._id.toString() === productId
      );
      if (!productExists) {
        return resolve({
          status: "ERR",
          message: "Product not found in cart"
        });
      }

      cart.products = cart.products.filter(
        (p) => p.productId._id.toString() !== productId
      );

      cart.totalPrice = cart.products.reduce((total, product) => {
        const productPrice = (product.productId.promotionPrice ?? product.productId.prices) || 0;
        return total + productPrice * product.quantity;
      }, 0);

      await cart.save();
      resolve({
        status: "OK",
        message: "Product removed from cart",
        data: cart
      });
    } catch (e) {
      console.error("Error removing product from cart:", e);
      reject({
        status: "ERR",
        message: "Error removing product from cart",
        error: e.message
      });
    }
  });
};

const deleteCart = async (userId) => {
  try {
    const cart = await Cart.findOneAndDelete({ userId }).populate(
      "products.productId",
      "name prices"
    );
    if (!cart) {
      throw new Error("Không tìm thấy giỏ hàng để xóa");
    }
    return { message: "Giỏ hàng đã được xóa thành công" };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  addOrUpdateProductInCart,
  UpdateProductInCart,
  getCartByUserId,
  removeProductFromCart,
  deleteCart
};
