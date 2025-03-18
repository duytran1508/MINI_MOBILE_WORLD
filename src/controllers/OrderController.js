const OrderService = require("../services/OrderService");
const Order = require("../models/OrderModel");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartId,
      shippingAddress,
      productIds,
      name,
      phone,
      email,
      voucherCode
    } = req.body;

    const selectedProductIds = Array.isArray(productIds)
      ? productIds
      : [productIds];

    const newOrder = await OrderService.createOrder(
      userId,
      cartId,
      shippingAddress,
      selectedProductIds,
      name,
      phone,
      email,
      voucherCode
    );

    res.status(200).json({ status: "OK", data: newOrder });
  } catch (error) {
    console.error("Lỗi trong createOrder controller:", error);
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Internal server error"
    });
  }
};
const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await OrderService.getAllOrdersByUser(userId);

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        status: "ERR",
        message: "Không có đơn hàng nào được tìm thấy cho người dùng này"
      });
    }

    res.status(200).json({
      status: "OK",
      data: orders
    });
  } catch (error) {
    console.error("Lỗi trong getAllOrdersByUser controller:", error);
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Internal server error"
    });
  }
};
const getAllOrders = async (req, res) => {
  try {
    const orders = await OrderService.getAllOrders();

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        status: "ERR",
        message: "Không có đơn hàng nào được tìm thấy"
      });
    }

    res.status(200).json({
      status: "OK",
      data: orders
    });
  } catch (error) {
    console.error("Lỗi trong getAllOrdersController:", error);
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Lỗi máy chủ nội bộ"
    });
  }
};
const getOrderById = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findById(orderId).populate("products.productId");

    if (!order) {
      return res.status(404).json({
        status: "ERR",
        message: "Order not found"
      });
    }

    return res.status(200).json({
      status: "OK",
      data: order
    });
  } catch (error) {
    console.error("Error in getOrderById controller:", error);
    return res.status(500).json({
      status: "ERR",
      message: "Internal server error"
    });
  }
};
const getAllOrdersByShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const orders = await OrderService.getAllOrdersByShop(shopId);
    res.status(200).json({ status: "OK", data: orders });
  } catch (error) {
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Lỗi hệ thống"
    });
  }
};
const shipOrder = async (req, res) => {
  try {
    const { orderId, shopId } = req.body;
    const shippedOrder = await OrderService.shipOrder(orderId, shopId);
    res.status(200).json({ status: "OK", message: "Đã giao hàng", data: shippedOrder });
  } catch (error) {
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Lỗi hệ thống"
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId, shopId } = req.body;
    const canceledOrder = await OrderService.cancelOrder(orderId, shopId);
    res.status(200).json({ status: "OK", message: "Đã hủy đơn hàng", data: canceledOrder });
  } catch (error) {
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Lỗi hệ thống"
    });
  }
};

const deliverOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const deliveredOrder = await OrderService.deliverOrder(orderId);
    res.status(200).json({ status: "OK", message: "Đã giao thành công", data: deliveredOrder });
  } catch (error) {
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Lỗi hệ thống"
    });
  }
};
const getOrdersByTimePeriodAllShops = async (req, res) => {
  try {
    const { status, timePeriod, date } = req.query;
    const result = await OrderService.getOrdersByTimePeriod(status, timePeriod, date);
    return res.status(200).json({ status: "OK", data: result });
  } catch (error) {
    console.error("Lỗi trong getOrdersByTimePeriodAllShops:", error);
    return res.status(500).json({
      status: "ERR",
      message: "Không thể lấy đơn hàng của tất cả các Shop",
      error: error.message
    });
  }
};

const getOrdersByTimePeriodByShop = async (req, res) => {
  try {
    const { shopId, status, timePeriod, date } = req.query;
    const result = await OrderService.getOrdersByTimePeriod(status, timePeriod, date, shopId);
    return res.status(200).json({ status: "OK", data: result });
  } catch (error) {
    console.error("Lỗi trong getOrdersByTimePeriodByShop:", error);
    return res.status(500).json({
      status: "ERR",
      message: "Không thể lấy đơn hàng của Shop",
      error: error.message
    });
  }
};
// API lấy tổng doanh thu của tất cả các Shop
const getTotalRevenueAllShops = async (req, res) => {
  try {
    const revenueData = await OrderService.getTotalRevenueAllShops();
    return res.status(200).json(revenueData);
  } catch (error) {
    return res.status(500).json({
      status: "ERR",
      message: "Không thể lấy tổng doanh thu của tất cả các Shop",
      error: error.message
    });
  }
};

// API lấy tổng doanh thu của từng Shop theo shopId
const getTotalRevenueByShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    if (!shopId) {
      return res.status(400).json({
        status: "ERR",
        message: "Vui lòng cung cấp shopId"
      });
    }

    const revenueData = await OrderService.getTotalRevenueByShop(shopId);
    return res.status(200).json(revenueData);
  } catch (error) {
    return res.status(500).json({
      status: "ERR",
      message: "Không thể lấy tổng doanh thu của Shop",
      error: error.message
    });
  }
};


module.exports = {
  getAllOrdersByUser,
  getAllOrders,
  createOrder,
  getOrderById,
  getAllOrdersByShop,
  cancelOrder,
  shipOrder,
  deliverOrder,
  getOrdersByTimePeriodAllShops,
  getOrdersByTimePeriodByShop,
  getTotalRevenueAllShops,
  getTotalRevenueByShop
};
