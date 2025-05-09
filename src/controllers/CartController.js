const CartService = require("../services/CartSevice");
const Product = require("../models/ProductModel");
const Cart = require("../models/CartModel");

const addOrUpdateProductInCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
      return res.status(400).json({
        status: "ERR",
        message: "userId, productId, and quantity are required"
      });
    }

    await CartService.addOrUpdateProductInCart(userId, productId, quantity);
    const updatedCart = await CartService.getCartByUserId(userId);

    res.status(200).json({
      status: "OK",
      message: "Cart updated successfully",
      data: updatedCart
    });
  } catch (error) {
    console.error("Error in addOrUpdateProductInCart Controller:", error);
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Internal server error"
    });
  }
};

const UpdateProductInCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        status: "ERR",
        message: "userId and productId are required"
      });
    }

    await CartService.UpdateProductInCart(userId, productId);
    const updatedCart = await CartService.getCartByUserId(userId);

    res.status(200).json({
      status: "OK",
      message: "Product quantity decreased by 1",
      data: updatedCart
    });
  } catch (error) {
    console.error("Error in UpdateProductInCart Controller:", error);
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Internal server error"
    });
  }
};

const getCartByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: "ERR",
        message: "Yêu cầu userId"
      });
    }

    const updatedCart = await CartService.getCartByUserId(userId);

    return res.status(200).json({
      status: "OK",
      message: "Lấy giỏ hàng thành công",
      data: updatedCart
    });
  } catch (error) {
    console.error("Error in getCartByUserId Controller:", error);
    return res.status(500).json({
      status: "ERR",
      message: error.message || "Đã xảy ra lỗi"
    });
  }
};

const removeProductFromCart = async (req, res) => {
  const { userId, productId } = req.params;
  try {
    const response = await CartService.removeProductFromCart(userId, productId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      message: e.message || "Đã xảy ra lỗi"
    });
  }
};
const deleteCart = async (req, res) => {
  const { userId } = req.params;
  try {
    const response = await CartService.deleteCart(userId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      message: e.message || "Đã xảy ra lỗi"
    });
  }
};

module.exports = {
  addOrUpdateProductInCart,
  UpdateProductInCart,
  getCartByUserId,
  removeProductFromCart,
  deleteCart
};
