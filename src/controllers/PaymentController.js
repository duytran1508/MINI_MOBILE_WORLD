const PaymentService = require("../services/PaymentService");
const OrderService = require("../services/OrderService");
const paypal = require("../config/paypal");

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


const createPaypalPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ status: "ERR", message: "Thiếu orderId" });
    }

    const order = await OrderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ status: "ERR", message: "Đơn hàng không tồn tại" });
    }

    const paymentData = {
      intent: "sale",
      payer: {
        payment_method: "paypal"
      },
      redirect_urls: {
        return_url: process.env.PAYPAL_RETURN_URL,
        cancel_url: process.env.PAYPAL_CANCEL_URL
      },
      transactions: [
        {
          amount: {
            total: order.orderTotal.toFixed(2),
            currency: "USD"
          },
          description: `Thanh toán đơn hàng #${orderId}`
        }
      ]
    };

    paypal.payment.create(paymentData, (err, payment) => {
      if (err) {
        console.error("Lỗi tạo thanh toán PayPal:", err);
        return res.status(500).json({ status: "ERR", message: "Lỗi hệ thống" });
      }

      // Lấy link thanh toán từ PayPal
      const approvalUrl = payment.links.find(link => link.rel === "approval_url").href;

      res.status(200).json({
        status: "OK",
        paymentURL: approvalUrl
      });
    });
  } catch (error) {
    console.error("Lỗi khi tạo thanh toán PayPal:", error);
    res.status(500).json({ status: "ERR", message: "Lỗi hệ thống" });
  }
};

const handlePaypalReturn = (req, res) => {
  const { paymentId, PayerID } = req.query;

  const executePayment = {
    payer_id: PayerID
  };

  paypal.payment.execute(paymentId, executePayment, (err, payment) => {
    if (err) {
      console.error("Lỗi xử lý thanh toán PayPal:", err);
      return res.status(500).json({ status: "ERR", message: "Lỗi hệ thống" });
    }

    res.status(200).json({
      status: "OK",
      message: "Thanh toán PayPal thành công",
      payment
    });
  });
};

const handlePaypalCancel = (req, res) => {
  res.status(400).json({ status: "CANCELLED", message: "Bạn đã hủy thanh toán" });
};


module.exports = {
  createPayment,
  handleVNPayCallback,
  updatePaymentStatus,
  createPaypalPayment,
  handlePaypalReturn,
  handlePaypalCancel
};
