const crypto = require("crypto");
const Order = require("../models/OrderModel"); // Đảm bảo có model Order
const config = require("../config/default.json"); // Đọc các thông số từ config hoặc .env

const createVNPayPaymentUrl = async (orderId, returnUrl) => {
  const { VNP_TMN_CODE, VNP_HASH_SECRET, VNP_URL, VNP_RETURN_URL } =
    process.env;
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error(`Đơn hàng với ID ${orderId} không tồn tại`);
  }
  const amount = order.orderTotal;

  if (!VNP_HASH_SECRET) {
    throw new Error("VNP_HASH_SECRET không được định nghĩa");
  }
  const date = new Date();
  const vnp_CreateDate = `${date.getFullYear()}${String(
    date.getMonth() + 1
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(
    date.getHours()
  ).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(
    date.getSeconds()
  ).padStart(2, "0")}`;

  // In ra thông tin order và các giá trị cần kiểm tra

  // Tạo các tham số yêu cầu
  let params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNP_TMN_CODE,
    vnp_Amount: amount * 100, // Đơn vị: VND
    vnp_CreateDate: vnp_CreateDate,
    vnp_CurrCode: "VND",
    vnp_IpAddr: "127.0.0.1", // Thay bằng IP người dùng nếu cần
    vnp_Locale: "vn",
    vnp_OrderInfo: orderId,
    vnp_OrderType: "billpayment",
    vnp_ReturnUrl: returnUrl || VNP_RETURN_URL,
    vnp_TxnRef: orderId
  };

  // In ra các tham số trước khi sắp xếp

  // Sắp xếp các tham số theo thứ tự alphabet
  const sortedParams = sortObject(params);
  const query = new URLSearchParams(sortedParams).toString();

  // Tạo SecureHash
  const secureHash = crypto
    .createHmac("sha512", VNP_HASH_SECRET)
    .update(query)
    .digest("hex");

  // Trả về URL thanh toán VNPay
  const paymentUrl = `${VNP_URL}?${query}&vnp_SecureHash=${secureHash}`;

  return paymentUrl;
};

// Hàm sắp xếp các tham số theo thứ tự alphabet
function sortObject(obj) {
  const sortedKeys = Object.keys(obj).sort();
  return sortedKeys.reduce((result, key) => {
    result[key] = obj[key];
    return result;
  }, {});
}

module.exports = {
  createVNPayPaymentUrl
};
