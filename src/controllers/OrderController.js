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

    if (!userId || !cartId || !name || !phone || !email) {
      return res.status(400).json({
        status: "ERR",
        message: "Thiếu thông tin bắt buộc (userId, cartId, name, phone, email)"
      });
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        status: "ERR",
        message: "Danh sách sản phẩm không hợp lệ"
      });
    }

    const newOrder = await OrderService.createOrder(
      userId,
      cartId,
      shippingAddress,
      productIds,
      name,
      phone,
      email,
      voucherCode
    );

    // Kiểm tra phản hồi từ service
    if (!newOrder || newOrder.status === "FAIL") {
      return res.status(400).json({
        status: "ERR",
        message: newOrder.message || "Không thể tạo đơn hàng"
      });
    }

    res.status(201).json({ status: "OK", data: newOrder.data });
  } catch (error) {
    console.error("Lỗi trong createOrder controller:", error);
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Lỗi hệ thống"
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

    if (!orderId || !shopId) {
      return res.status(400).json({
        status: "ERR",
        message: "Thiếu thông tin orderId hoặc shopId"
      });
    }

    const shippedOrder = await OrderService.shipOrder(orderId, shopId);

    if (shippedOrder.status === "FAIL") {
      return res.status(400).json({
        status: "ERR",
        message: shippedOrder.message || "Không thể giao hàng"
      });
    }

    res.status(200).json({
      status: "OK",
      message: `Shop ${shopId} đã giao hàng`,
      data: shippedOrder
    });
  } catch (error) {
    console.error("Lỗi trong shipOrder controller:", error);
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Lỗi hệ thống"
    });
  }
};
const cancelOrder = async (req, res) => {
  try {
    const { orderId, shopId } = req.body;

    if (!orderId || !shopId) {
      return res.status(400).json({
        status: "ERR",
        message: "Thiếu thông tin orderId hoặc shopId"
      });
    }

    const canceledOrder = await OrderService.cancelOrder(orderId, shopId);

    if (canceledOrder.status === "FAIL") {
      return res.status(400).json({
        status: "ERR",
        message: canceledOrder.message || "Không thể hủy đơn hàng"
      });
    }

    res.status(200).json({
      status: "OK",
      message: `Shop ${shopId} đã hủy đơn hàng`,
      data: canceledOrder
    });
  } catch (error) {
    console.error("Lỗi trong cancelOrder controller:", error);
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Lỗi hệ thống"
    });
  }
};
const deliverOrder = async (req, res) => {
  try {
    const { orderId, shopId } = req.body;

    if (!orderId || !shopId) {
      return res.status(400).json({
        status: "ERR",
        message: "Thiếu thông tin orderId hoặc shopId"
      });
    }

    const deliveredOrder = await OrderService.deliverOrder(orderId, shopId);

    if (deliveredOrder.status === "FAIL") {
      return res.status(400).json({
        status: "ERR",
        message: deliveredOrder.message || "Không thể xác nhận giao hàng"
      });
    }

    res.status(200).json({
      status: "OK",
      message: `Shop ${shopId} đã xác nhận giao hàng`,
      data: deliveredOrder
    });
  } catch (error) {
    console.error("Lỗi trong deliverOrder controller:", error);
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Lỗi hệ thống"
    });
  }
};
const getOrdersByTimePeriodAllShops = async (req, res) => {
  try {
    const { status, timePeriod, date } = req.query;

    if (!status || !timePeriod || !date) {
      return res.status(400).json({
        status: "ERR",
        message: "Thiếu thông tin bắt buộc: status, timePeriod, date"
      });
    }

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

    if (!shopId || !status || !timePeriod || !date) {
      return res.status(400).json({
        status: "ERR",
        message: "Thiếu thông tin bắt buộc: shopId, status, timePeriod, date"
      });
    }

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
const getTotalRevenueAllShops = async (req, res) => {
  try {
    const revenueData = await OrderService.getTotalRevenueAllShops();

    if (!revenueData || revenueData.status === "ERR") {
      return res.status(500).json({
        status: "ERR",
        message: "Không thể lấy tổng doanh thu của tất cả các Shop"
      });
    }

    return res.status(200).json({
      status: "OK",
      message: "Tổng doanh thu của tất cả các Shop",
      totalRevenue: revenueData.totalRevenue,
      revenueByShop: revenueData.revenueByShop
    });
  } catch (error) {
    console.error("Lỗi trong getTotalRevenueAllShops:", error);
    return res.status(500).json({
      status: "ERR",
      message: "Không thể lấy tổng doanh thu của tất cả các Shop",
      error: error.message
    });
  }
};
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

    if (!revenueData || revenueData.status === "ERR") {
      return res.status(500).json({
        status: "ERR",
        message: `Không thể lấy tổng doanh thu của Shop ${shopId}`
      });
    }

    return res.status(200).json({
      status: "OK",
      message: `Tổng doanh thu của Shop ${shopId}`,
      totalRevenue: revenueData.totalRevenue
    });
  } catch (error) {
    console.error("Lỗi trong getTotalRevenueByShop:", error);
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
