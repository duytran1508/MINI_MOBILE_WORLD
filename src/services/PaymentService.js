const crypto = require("crypto");
const Order = require("../models/OrderModel");

const createVNPayPaymentUrl = async (orderIdString, returnUrl) => {
  const { VNP_TMN_CODE, VNP_HASH_SECRET, VNP_URL, VNP_RETURN_URL } = process.env;

  // Tách orderId thành mảng nếu có nhiều đơn hàng
  const orderIds = orderIdString.split(",");

  // Kiểm tra tính hợp lệ của orderIds
  if (!orderIds.every(id => /^[0-9a-fA-F]{24}$/.test(id))) {
    throw new Error("⚠️ Một hoặc nhiều orderId không hợp lệ.");
  }

  // Lấy tất cả đơn hàng từ DB
  const orders = await Order.find({ _id: { $in: orderIds } });

  if (orders.length === 0) {
    throw new Error("Không tìm thấy đơn hàng để thanh toán.");
  }

  // Tính tổng tiền của tất cả đơn hàng
  const totalAmount = orders.reduce((sum, order) => sum + order.orderTotal, 0);

  if (!VNP_HASH_SECRET) {
    throw new Error("⚠️ VNP_HASH_SECRET không được định nghĩa.");
  }

  const date = new Date();
  const vnp_CreateDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;

  let params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNP_TMN_CODE,
    vnp_Amount: totalAmount * 100, // VNPay yêu cầu nhân 100
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

// Hàm sắp xếp tham số theo thứ tự alphabet
function sortObject(obj) {
  const sortedKeys = Object.keys(obj).sort();
  return sortedKeys.reduce((result, key) => {
    result[key] = obj[key];
    return result;
  }, {});
}

// Lấy thông tin đơn hàng theo ID
const getOrderById = async (orderId) => {
  if (!/^[0-9a-fA-F]{24}$/.test(orderId)) {
    throw new Error("⚠️ orderId không hợp lệ.");
  }
  return await Order.findById(orderId);
};

// Cập nhật trạng thái thanh toán của nhiều đơn hàng
const updatePaymentStatus = async (orderIds, isSuccess) => {
  try {
    // Kiểm tra tính hợp lệ của orderIds trước khi cập nhật
    if (!Array.isArray(orderIds) || !orderIds.every(id => /^[0-9a-fA-F]{24}$/.test(id))) {
      throw new Error("⚠️ Một hoặc nhiều orderId không hợp lệ.");
    }

    const updated = await Order.updateMany(
      { _id: { $in: orderIds } },
      { isPaid: isSuccess }
    );

    return {
      success: true,
      message: `✅ Đã cập nhật ${updated.modifiedCount} đơn hàng.`
    };
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật trạng thái thanh toán:", error);
    return {
      success: false,
      message: "❌ Lỗi khi cập nhật trạng thái thanh toán."
    };
  }
};

module.exports = {
  createVNPayPaymentUrl,
  getOrderById,
  updatePaymentStatus
};
