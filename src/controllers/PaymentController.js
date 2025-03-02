const PaymentService = require("../services/PaymentService");
const OrderService = require("../services/OrderService");

const createPayment = async (req, res) => {
  try {
    const { orderId, returnUrl } = req.body;

    if (!orderId || !returnUrl) {
      return res.status(400).json({
        status: "ERR",
        message: "orderId và returnUrl là bắt buộc"
      });
    }

    const paymentURL = await PaymentService.createVNPayPaymentUrl(
      orderId,
      returnUrl
    );

    return res.status(200).json({
      status: "OK",
      success: true,
      paymentURL: paymentURL
    });
  } catch (e) {
    console.error("Lỗi khi tạo URL thanh toán:", e.message);
    return res.status(500).json({
      status: "ERR",
      message: "Lỗi khi tạo URL thanh toán",
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
        message: "Thiếu thông tin từ VNPay callback"
      });
    }

    if (vnp_ResponseCode === "00") {
      const updateResult = await OrderService.updatePaymentStatus(
        vnp_TxnRef,
        true
      );

      if (updateResult.success) {
        return res.status(200).json({
          status: "OK",
          success: true,
          message: "Thanh toán thành công"
        });
      }

      return res.status(400).json({
        status: "ERR",
        message: "Cập nhật trạng thái thanh toán thất bại"
      });
    }

    await OrderService.updatePaymentStatus(vnp_TxnRef, false);

    return res.status(400).json({
      status: "ERR",
      success: false,
      message: "Thanh toán không thành công"
    });
  } catch (e) {
    console.error("Lỗi khi xử lý callback từ VNPay:", e.message);
    return res.status(500).json({
      status: "ERR",
      message: "Lỗi hệ thống",
      error: e.message
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId, isSuccess } = req.body;
    console.log({ orderId, isSuccess });
    if (!orderId || typeof isSuccess !== "boolean") {
      return res.status(400).json({
        status: "ERR",
        message: "orderId và isSuccess là bắt buộc"
      });
    }

    const updateResult = await OrderService.updatePaymentStatus(
      orderId,
      isSuccess
    );

    if (updateResult.success) {
      return res.status(200).json({
        status: "OK",
        success: true,
        message: updateResult.message
      });
    }

    return res.status(400).json({
      status: "ERR",
      success: false,
      message: updateResult.message
    });
  } catch (e) {
    console.error("Lỗi khi cập nhật trạng thái thanh toán:", e.message);
    return res.status(500).json({
      status: "ERR",
      message: "Lỗi hệ thống",
      error: e.message
    });
  }
};

module.exports = {
  createPayment,
  handleVNPayCallback,
  updatePaymentStatus
};
