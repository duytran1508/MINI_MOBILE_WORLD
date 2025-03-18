const Order = require("../models/OrderModel");
const Cart = require("../models/CartModel");
const Product = require("../models/ProductModel");
const Voucher = require("../models/VoucherModel");
const mongoose = require("mongoose");

const createOrder = async (
  userId,
  cartId,
  shippingAddress,
  productIds,
  name,
  phone,
  email,
  voucherCode
) => {
  try {
    // Lấy giỏ hàng và populate sản phẩm
    const cart = await Cart.findById(cartId).populate({
      path: "products.productId",
      model: "Product",
      select: "price promotionPrice shopId"
    });

    if (!cart) {
      return { status: "FAIL", message: "Không tìm thấy giỏ hàng" };
    }

    // Log kiểm tra giỏ hàng
    console.log("Giỏ hàng hiện tại:", JSON.stringify(cart.products, null, 2));

    // Lọc sản phẩm dựa trên productIds
    const selectedProducts = cart.products.filter(item =>
      productIds.includes(String(item.productId._id))
    );

    // Kiểm tra sản phẩm đã chọn
    console.log("Sản phẩm đã chọn:", JSON.stringify(selectedProducts, null, 2));

    if (selectedProducts.length === 0) {
      return { status: "FAIL", message: "Không có sản phẩm hợp lệ trong giỏ hàng" };
    }

    // Lấy thông tin sản phẩm và kiểm tra
    const products = selectedProducts.map(item => ({
      productId: item.productId._id,
      shopId: item.productId.shopId,
      quantity: item.quantity,
      price: item.productId.promotionPrice || item.productId.price,
    }));

    // Log kiểm tra sản phẩm trước khi lưu
    console.log("Danh sách sản phẩm lưu vào đơn hàng:", JSON.stringify(products, null, 2));

    // Tính tổng tiền
    const totalPrice = products.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );

    const VAT = totalPrice * 0.1;
    const shippingFee = totalPrice >= 50000000 ? 0 : 800000;

    // Áp dụng mã giảm giá
    let discount = 0;
    if (voucherCode) {
      const voucher = await Voucher.findOne({ code: voucherCode });
      if (voucher && voucher.discount > 0 && voucher.discount <= 100) {
        discount = (totalPrice + shippingFee + VAT) * (voucher.discount / 100);
      }
    }

    const discountedPrice = totalPrice + shippingFee + VAT - discount;
    const orderTotal = parseFloat(Math.max(discountedPrice, 0).toFixed(2));

    // Tạo đơn hàng mới
    const newOrder = new Order({
      name,
      phone,
      email,
      userId,
      cartId,
      products,
      shippingAddress,
      totalPrice,
      discount,
      VAT,
      shippingFee,
      orderTotal,
      status: "Pending",
    });

    await newOrder.save();
    console.log("Đơn hàng đã lưu:", JSON.stringify(newOrder, null, 2));

    // Cập nhật giỏ hàng: Xóa các sản phẩm đã thanh toán
    cart.products = cart.products.filter(
      item => !productIds.includes(String(item.productId._id))
    );

    await cart.save();

    return {
      status: "OK",
      data: {
        ...newOrder.toObject(),
        discount,
        totalPrice,
      },
    };
  } catch (error) {
    console.error("Lỗi trong createOrder service:", error);
    return { status: "FAIL", message: "Lỗi hệ thống, vui lòng thử lại sau." };
  }
};

const getAllOrdersByUser = async (userId) => {
  try {
    const orders = await Order.find({ userId }).populate("products.productId");
    return orders;
  } catch (error) {
    console.error("Lỗi trong getAllOrdersByUser service:", error);
    throw error;
  }
};

const getAllOrders = async () => {
  try {
    const orders = await Order.find().populate("products.productId");
    return orders;
  } catch (error) {
    console.error("Lỗi trong getAllOrders service:", error);
    throw error;
  }
};

const getOrderById = (orderId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await Order.findById(orderId).populate(
        "products.productId"
      );
      if (!order) {
        return reject({
          status: "ERR",
          message: "Order not found"
        });
      }
      resolve(order);
    } catch (error) {
      reject({
        status: "ERR",
        message: "Error while retrieving order: " + error.message
      });
    }
  });
};
const getAllOrdersByShop = async (shopId) => {
  try {
    const orders = await Order.find({ "products.shopId": shopId }).populate("products.productId");

    // Lọc chính xác sản phẩm theo shopId trong mỗi đơn hàng
    const filteredOrders = orders
      .map(order => {
        const shopProducts = order.products.filter(item => item.shopId.toString() === shopId);

        return {
          ...order.toObject(), 
          products: shopProducts
        };
      })
      .filter(order => order.products.length > 0); // Chỉ giữ đơn hàng có sản phẩm thuộc shop

    return filteredOrders;
  } catch (error) {
    throw new Error("Lỗi khi lấy đơn hàng của shop: " + error.message);
  }
};

const shipOrder = async (orderId, shopId) => {
  try {
    const order = await Order.findById(orderId).populate("products.productId");

    if (!order) {
      return { status: "FAIL", message: "Không tìm thấy đơn hàng" };
    }

    let isShipped = false;

    // Duyệt qua các sản phẩm trong đơn hàng
    order.products.forEach((item) => {
      // Kiểm tra shopId và trạng thái Pending
      if (item.shopId.toString() === shopId && !item.approved) {
        item.approved = true;
        isShipped = true;

        // Cập nhật số lượng tồn kho
        if (item.productId.quantityInStock >= item.quantity) {
          item.productId.quantityInStock -= item.quantity;
          item.productId.soldQuantity += item.quantity;
          item.productId.save();
        } else {
          throw { status: 400, message: `Sản phẩm ${item.productId.name} không đủ số lượng tồn kho` };
        }
      }
    });

    if (!isShipped) {
      return { status: "FAIL", message: "Không có sản phẩm nào cần giao" };
    }

    // Kiểm tra nếu tất cả các sản phẩm đã được duyệt
    if (order.products.every((item) => item.approved)) {
      order.status = "Shipped";
    }

    await order.save();
    return { status: "OK", message: "Đã giao hàng", data: order };
  } catch (error) {
    console.error("Lỗi trong shipOrder service:", error);
    return { status: "FAIL", message: error.message || "Lỗi hệ thống" };
  }
};


const cancelOrder = async (orderId, shopId) => {
  try {
    const order = await Order.findById(orderId).populate('products.productId');
    if (!order) throw { status: 404, message: 'Không tìm thấy đơn hàng' };

    const canceledProducts = order.products.map(item => {
      if (item.shopId.toString() === shopId && item.status !== 'Delivered') {
        item.status = 'Cancelled';
        return item;
      }
      return item;
    });

    if (!canceledProducts.some(item => item.status === 'Cancelled'))
      throw { status: 400, message: 'Không có sản phẩm nào cần hủy' };

    if (canceledProducts.every(item => item.status === 'Cancelled')) {
      order.status = 'Cancelled';
    }

    await order.save();
    return order;
  } catch (error) {
    throw { status: error.status || 500, message: error.message || 'Lỗi hệ thống' };
  }
};

const deliverOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw { status: 404, message: 'Không tìm thấy đơn hàng' };

    // Kiểm tra trạng thái đơn hàng có phải là "Shipped" không
    if (order.status !== 'Shipped') {
      throw { status: 400, message: 'Đơn hàng chưa được giao đầy đủ' };
    }

    // Cập nhật trạng thái đơn hàng thành "Delivered" và đã thanh toán
    order.status = 'Delivered';
    order.isPaid = true;

    await order.save();
    return order;
  } catch (error) {
    console.error("Lỗi trong deliverOrder service:", error);
    throw { status: error.status || 500, message: error.message || 'Lỗi hệ thống' };
  }
};

const updatePaymentStatus = async (orderId, isSuccess) => {
  console.log(isSuccess);

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, message: "Không tìm thấy đơn hàng" };
    }

    if (isSuccess) {
      order.isPaid = true;
    }
    await order.save();

    return {
      success: true,
      message: "Cập nhật trạng thái thanh toán thành công",
      returnUrl: "http://localhost:3000/ket-qua-thanh-toan"
    };
  } catch (e) {
    console.error("Lỗi khi cập nhật trạng thái thanh toán:", e.message);
    return {
      success: false,
      message: "Cập nhật trạng thái thanh toán thất bại",
      error: e.message
    };
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
        return res.redirect(updateResult.returnUrl);
      }

      return res.status(400).json({
        status: "ERR",
        message: "Cập nhật trạng thái thanh toán thất bại"
      });
    } else if (vnp_ResponseCode === "24" || vnp_TransactionStatus === "02") {
      const order = await Order.findOne({ vnp_TxnRef });

      if (!order) {
        return res.status(404).json({
          status: "ERR",
          message: "Không tìm thấy đơn hàng"
        });
      }

      return res.status(200).json({
        status: "ERR",
        message: "Thanh toán bị hủy",
        order: order
      });
    } else {
      return res.status(400).json({
        status: "ERR",
        message: "Lỗi thanh toán từ VNPay",
        errorCode: vnp_ResponseCode
      });
    }
  } catch (e) {
    console.error("Lỗi khi xử lý callback từ VNPay:", e.message);
    return res.status(500).json({
      status: "ERR",
      message: "Lỗi hệ thống",
      error: e.message
    });
  }
};

const getOrdersByTimePeriod = async (status, timePeriod, date, shopId = null) => {
  try {
    let startUtcDate, endUtcDate;
    const selectedDate = new Date(date);

    if (timePeriod === "day") {
      startUtcDate = new Date(selectedDate.setHours(0, 0, 0, 0));
      endUtcDate = new Date(selectedDate.setHours(23, 59, 59, 999));
    } else if (timePeriod === "week") {
      const dayOfWeek = selectedDate.getDay();
      startUtcDate = new Date(selectedDate.setDate(selectedDate.getDate() - dayOfWeek + 1));
      endUtcDate = new Date(selectedDate.setDate(startUtcDate.getDate() + 6));
    } else if (timePeriod === "month") {
      startUtcDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      endUtcDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);
    } else {
      throw new Error("Invalid time period. Use 'day', 'week', or 'month'.");
    }

    const filter = {
      status,
      createdAt: { $gte: startUtcDate, $lte: endUtcDate }
    };

    if (shopId) filter["products.shopId"] = shopId;

    const orders = await Order.find(filter).populate("products.productId");

    const filteredOrders = shopId
      ? orders.map(order => {
          const shopProducts = order.products.filter(item => item.shopId.toString() === shopId);
          return { ...order.toObject(), products: shopProducts };
        }).filter(order => order.products.length > 0)
      : orders;

    const totalProducts = filteredOrders.reduce(
      (sum, order) => sum + order.products.reduce((acc, item) => acc + item.quantity, 0),
      0
    );

    const totalOrders = filteredOrders.length;
    const totalAmount = filteredOrders.reduce((sum, order) => sum + order.orderTotal, 0);

    return {
      orders: filteredOrders,
      totalProducts,
      totalAmount,
      totalOrders,
      startDate: startUtcDate,
      endDate: endUtcDate
    };
  } catch (error) {
    console.error("Error in getOrdersByTimePeriod:", error);
    throw error;
  }
};
// Tính tổng doanh thu của tất cả các Shop
const getTotalRevenueAllShops = async () => {
  try {
    const deliveredOrders = await Order.find({ status: "Delivered" });

    const totalRevenue = deliveredOrders.reduce(
      (sum, order) => sum + order.orderTotal,
      0
    );

    return {
      status: "OK",
      message: "Tổng doanh thu của tất cả các Shop",
      totalRevenue
    };
  } catch (error) {
    console.error("Error in getTotalRevenueAllShops:", error);
    throw {
      status: "ERR",
      message: "Không thể tính tổng doanh thu của tất cả các Shop",
      error: error.message
    };
  }
};

// Tính tổng doanh thu của từng Shop theo shopId
const getTotalRevenueByShop = async (shopId) => {
  try {
    const deliveredOrders = await Order.find({ 
      status: "Delivered", 
      "products.shopId": shopId 
    });

    const totalRevenue = deliveredOrders.reduce((sum, order) => {
      const shopProducts = order.products.filter(
        (item) => String(item.shopId) === String(shopId)
      );

      const shopRevenue = shopProducts.reduce(
        (total, product) => total + product.price * product.quantity,
        0
      );

      return sum + shopRevenue;
    }, 0);

    return {
      status: "OK",
      message: `Tổng doanh thu của Shop ${shopId}`,
      totalRevenue
    };
  } catch (error) {
    console.error("Error in getTotalRevenueByShop:", error);
    throw {
      status: "ERR",
      message: `Không thể tính tổng doanh thu của Shop ${shopId}`,
      error: error.message
    };
  }
};


module.exports = {
  createOrder,
  getAllOrdersByUser,
  getAllOrders,
  getOrderById,
  getAllOrdersByShop,
  cancelOrder,
  shipOrder,
  deliverOrder,
  handleVNPayCallback,
  updatePaymentStatus,
  getOrdersByTimePeriod,
  getTotalRevenueAllShops,
  getTotalRevenueByShop,
};
