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
const cancelOrder = async (req, res) => {
  const { orderId } = req.body;

  try {
    const canceledOrder = await OrderService.cancelOrder(orderId);
    res.status(200).json({
      status: "OK",
      message: "Order canceled successfully",
      data: canceledOrder
    });
  } catch (error) {
    console.error("Error in cancelOrderController:", error);
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Internal server error"
    });
  }
};

const shipOrder = async (req, res) => {
  const { orderId } = req.body;

  try {
    const shippedOrder = await OrderService.shipOrder(orderId);
    res.status(200).json({
      status: "OK",
      message: "Order shipped successfully",
      data: shippedOrder
    });
  } catch (error) {
    console.error("Error in shipOrderController:", error);
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Internal server error"
    });
  }
};

const deliverOrder = async (req, res) => {
  const { orderId } = req.body;

  try {
    const deliveredOrder = await OrderService.deliverOrder(orderId);
    res.status(200).json({
      status: "OK",
      message: "Order delivered successfully",
      data: deliveredOrder
    });
  } catch (error) {
    console.error("Error in deliverOrderController:", error);
    res.status(error.status || 500).json({
      status: "ERR",
      message: error.message || "Internal server error"
    });
  }
};
const getOrdersByStatusAndDateController = async (req, res) => {
  try {
    const { status, date, timePeriod } = req.body; // Lấy thông tin từ body (POST)
    console.log({ status, date, timePeriod });

    // Kiểm tra timePeriod hợp lệ
    if (!["day", "week", "month"].includes(timePeriod)) {
      return res.status(400).json({
        message:
          "Thời gian không hợp lệ. Vui lòng chọn 'day', 'week', hoặc 'month'."
      });
    }

    // Gọi service để lấy đơn hàng
    const orders = await OrderService.getOrdersByTimePeriod(
      status,
      timePeriod,
      date
    );

    // Trả về kết quả
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Lỗi trong getOrdersByStatusAndDateController:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
const getRevenue = async (req, res) => {
  try {
    const revenueData = await OrderService.getTotalRevenue();
    return res.status(200).json(revenueData);
  } catch (error) {
    return res.status(500).json({
      status: "ERR",
      message: "Không thể lấy tổng doanh thu",
      error: error.message
    });
  }
};
module.exports = {
  getAllOrdersByUser,
  getAllOrders,
  createOrder,
  getOrderById,
  cancelOrder,
  shipOrder,
  deliverOrder,
  getRevenue,
  getOrdersByStatusAndDateController
};
