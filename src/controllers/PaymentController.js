const PaymentService = require("../services/PaymentService");
const OrderService = require("../services/OrderService");

const createPayment = async (req, res) => {
  try {
    const { orderIds, returnUrl } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0 || !returnUrl) {
      return res.status(400).json({
        status: "ERR",
        message: "⚠️ orderIds (mảng) và returnUrl là bắt buộc."
      });
    }

    // Nối các orderId thành chuỗi để gửi tới VNPay
    const orderIdString = orderIds.join(",");

    const paymentURL = await PaymentService.createVNPayPaymentUrl(orderIdString, returnUrl);

    return res.status(200).json({
      status: "OK",
      success: true,
      paymentURL
    });
  } catch (e) {
    console.error("❌ Lỗi khi tạo URL thanh toán:", e.message);
    return res.status(500).json({
      status: "ERR",
      message: "❌ Lỗi khi tạo URL thanh toán.",
      error: e.message
    });
  }
};

const handleVNPayCallback = async (req, res) => {
  try {
    const { vnp_ResponseCode, vnp_TxnRef } = req.query;

    if (!vnp_ResponseCode || !vnp_TxnRef) {
      return res.status(400).json({
        status: "ERR",
        message: "⚠️ Thiếu thông tin từ VNPay callback."
      });
    }

    // Lấy danh sách orderIds từ vnp_TxnRef (có thể chứa nhiều ID cách nhau bằng dấu ",")
    const orderIds = vnp_TxnRef.split(",");

    // Kiểm tra xem orderIds có hợp lệ không
    if (!orderIds.every(id => /^[0-9a-fA-F]{24}$/.test(id))) {
      return res.status(400).json({
        status: "ERR",
        message: "⚠️ Một hoặc nhiều orderId không hợp lệ."
      });
    }

    // Nếu thanh toán thành công (00), cập nhật trạng thái đơn hàng
    if (vnp_ResponseCode === "00") {
      const updateResult = await PaymentService.updatePaymentStatus(orderIds, true);
      
      return res.status(200).json({
        status: "OK",
        success: true,
        message: "✅ Thanh toán thành công!",
        orderIds,
        updatedOrders: updateResult.updatedCount
      });
    }

    // Nếu thất bại, cập nhật đơn hàng thành `isPaid: false`
    await PaymentService.updatePaymentStatus(orderIds, false);

    return res.status(400).json({
      status: "ERR",
      success: false,
      message: "❌ Thanh toán không thành công.",
      orderIds
    });
  } catch (e) {
    console.error("❌ Lỗi khi xử lý callback từ VNPay:", e.message);
    return res.status(500).json({
      status: "ERR",
      message: "❌ Lỗi hệ thống.",
      error: e.message
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { orderIds, isSuccess } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0 || typeof isSuccess !== "boolean") {
      return res.status(400).json({
        status: "ERR",
        message: "⚠️ orderIds (mảng) và isSuccess (boolean) là bắt buộc."
      });
    }

    const updateResult = await PaymentService.updatePaymentStatus(orderIds, isSuccess);

    return res.status(200).json({
      status: "OK",
      success: true,
      message: `✅ Cập nhật trạng thái thanh toán thành công cho ${updateResult.updatedCount} đơn hàng.`,
      orderIds
    });
  } catch (e) {
    console.error("❌ Lỗi khi cập nhật trạng thái thanh toán:", e.message);
    return res.status(500).json({
      status: "ERR",
      message: "❌ Lỗi hệ thống.",
      error: e.message
    });
  }
};




module.exports = {
  createPayment,
  handleVNPayCallback,
  updatePaymentStatus,
};
