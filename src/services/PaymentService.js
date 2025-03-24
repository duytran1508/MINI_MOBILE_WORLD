const crypto = require("crypto");
const Order = require("../models/OrderModel"); // Đảm bảo có model Order
const config = require("../config/default.json"); // Đọc các thông số từ config hoặc .env

const createVNPayPaymentUrl = async (orderIdString, returnUrl) => {
  const { VNP_TMN_CODE, VNP_HASH_SECRET, VNP_URL, VNP_RETURN_URL } = process.env;

  // Tách orderId thành mảng nếu có nhiều đơn hàng
  const orderIds = orderIdString.split(",");

  // Lấy tất cả đơn hàng từ DB
  const orders = await Order.find({ _id: { $in: orderIds } });

  if (orders.length === 0) {
    throw new Error("Không tìm thấy đơn hàng để thanh toán");
  }

  // Tính tổng tiền của tất cả đơn hàng
  const totalAmount = orders.reduce((sum, order) => sum + order.orderTotal, 0);

  if (!VNP_HASH_SECRET) {
    throw new Error("VNP_HASH_SECRET không được định nghĩa");
  }

  const date = new Date();
  const vnp_CreateDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;

  let params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNP_TMN_CODE,
    vnp_Amount: totalAmount * 100, // Đơn vị VNPay là VND * 100
    vnp_CreateDate,
    vnp_CurrCode: "VND",
    vnp_IpAddr: "127.0.0.1", // Thay bằng IP thực tế của người dùng nếu cần
    vnp_Locale: "vn",
    vnp_OrderInfo: orderIdString, // Gửi danh sách orderIds đến VNPay
    vnp_OrderType: "billpayment",
    vnp_ReturnUrl: returnUrl || VNP_RETURN_URL,
    vnp_TxnRef: orderIdString
  };

  // Sắp xếp params theo thứ tự alphabet
  const sortedParams = sortObject(params);
  const query = new URLSearchParams(sortedParams).toString();

  // Tạo SecureHash
  const secureHash = crypto
    .createHmac("sha512", VNP_HASH_SECRET)
    .update(query)
    .digest("hex");

  // Trả về URL thanh toán VNPay
  return `${VNP_URL}?${query}&vnp_SecureHash=${secureHash}`;
};

// Hàm sắp xếp các tham số theo thứ tự alphabet
function sortObject(obj) {
  const sortedKeys = Object.keys(obj).sort();
  return sortedKeys.reduce((result, key) => {
    result[key] = obj[key];
    return result;
  }, {});
}

const getOrderById = async (orderId) => {
  return await Order.findById(orderId);
};

const updatePaymentStatus = async (orderIds, isSuccess) => {
  try {
    const updated = await Order.updateMany(
      { _id: { $in: orderIds } },
      { isPaid: isSuccess }
    );

    return {
      success: true,
      message: `Đã cập nhật ${updated.modifiedCount} đơn hàng`
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái thanh toán:", error);
    return {
      success: false,
      message: "Lỗi khi cập nhật trạng thái thanh toán"
    };
  }
};


const handleVNPayCallback = async (req, res) => {
  try {
    const { vnp_ResponseCode, vnp_TxnRef } = req.query;

    if (!vnp_ResponseCode || !vnp_TxnRef) {
      return res.status(400).json({ status: "ERR", message: "Thiếu thông tin từ VNPay callback" });
    }

    // Tách danh sách orderId từ vnp_TxnRef (vì có thể chứa nhiều orderId ngăn cách bởi '-')
    const orderIds = vnp_TxnRef.split("-");

    if (vnp_ResponseCode === "00") {
      // Cập nhật trạng thái tất cả đơn hàng thành "Đã thanh toán"
      await Order.updateMany({ _id: { $in: orderIds } }, { isPaid: true });

      return res.redirect("http://localhost:3000/ket-qua-thanh-toan");
    } else if (vnp_ResponseCode === "24") {
      // Xử lý khi giao dịch bị hủy bởi người dùng
      await Order.updateMany({ _id: { $in: orderIds } }, { status: "Cancelled" });

      return res.status(200).json({ status: "ERR", message: "Thanh toán bị hủy", orderIds });
    } else {
      return res.status(400).json({ status: "ERR", message: "Lỗi thanh toán từ VNPay", errorCode: vnp_ResponseCode });
    }
  } catch (e) {
    console.error("Lỗi khi xử lý callback từ VNPay:", e.message);
    return res.status(500).json({ status: "ERR", message: "Lỗi hệ thống", error: e.message });
  }
};

module.exports = {
  createVNPayPaymentUrl,
  getOrderById,
  handleVNPayCallback,
  updatePaymentStatus,
};
