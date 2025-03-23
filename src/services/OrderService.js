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

    const selectedProducts = cart.products.filter(item =>
      productIds.includes(String(item.productId._id))
    );

    if (selectedProducts.length === 0) {
      return { status: "FAIL", message: "Không có sản phẩm hợp lệ trong giỏ hàng" };
    }

    const products = selectedProducts.map(item => ({
      productId: item.productId._id,
      shopId: item.productId.shopId,
      quantity: item.quantity,
      price: item.productId.promotionPrice || item.productId.price,
      approved: false  // Mặc định sản phẩm chưa được duyệt
    }));

    //  **Khởi tạo trạng thái từng shop**
    const shopStatus = {};
    products.forEach(p => {
      shopStatus[p.shopId.toString()] = "Pending";
    });

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

    const orderTotal = totalPrice + shippingFee + VAT - discount;

    // **Cập nhật `shopStatus` khi tạo đơn hàng**
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
      isPaid: false,
      shopStatus  
    });

    await newOrder.save();

    // Cập nhật giỏ hàng: Xóa các sản phẩm đã thanh toán
    cart.products = cart.products.filter(
      item => !productIds.includes(String(item.productId._id))
    );

    await cart.save();

    return {
      status: "OK",
      data: newOrder
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
        // Cập nhật trạng thái của shop trong đơn hàng
    order.shopStatus.set(shopId, "Shipped");
    // Kiểm tra nếu tất cả các sản phẩm đã được duyệt
    if ([...order.shopStatus.values()].every(status => status === "Shipped")) {
      order.status = "Shipped";
    } else {
      order.status = "Partially Shipped";
    }

    await order.save();
    return { status: "OK", message: `Shop ${shopId} đã giao hàng`, data: order };
  } catch (error) {
    console.error("Lỗi trong shipOrder service:", error);
    return { status: "FAIL", message: "Lỗi hệ thống" };
  }
};
const cancelOrder = async (orderId, shopId) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) throw { status: 404, message: 'Không tìm thấy đơn hàng' };

    let isCancelled = false;

    order.products.forEach((item) => {
      if (item.shopId.toString() === shopId && !item.approved) {
        item.approved = false;  // Đánh dấu sản phẩm của shop này bị hủy
        isCancelled = true;
      }
    });

    if (!isCancelled) {
      return { status: "FAIL", message: "Không có sản phẩm nào cần hủy" };
    }

    // Đánh dấu shop này đã hủy đơn
    order.shopStatus.set(shopId, "Cancelled");

    // Nếu tất cả các shop đều hủy, hủy toàn bộ đơn hàng
    if ([...order.shopStatus.values()].every(status => status === "Cancelled")) {
      order.status = "Cancelled";
    } else {
      order.status = "Partially Cancelled";
    }

    await order.save();
    return { status: "OK", message: `Shop ${shopId} đã hủy đơn hàng`, data: order };
  } catch (error) {
    throw { status: error.status || 500, message: error.message || 'Lỗi hệ thống' };
  }
};
const deliverOrder = async (orderId, shopId) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) throw { status: 404, message: 'Không tìm thấy đơn hàng' };

    if (order.shopStatus.get(shopId) !== "Shipped") {
      return { status: "FAIL", message: `Shop ${shopId} chưa giao hàng, không thể hoàn tất đơn hàng` };
    }

    // Đánh dấu shop này đã giao hàng thành công
    order.shopStatus.set(shopId, "Delivered");

    // Nếu tất cả shop đã giao hàng, cập nhật trạng thái đơn hàng thành "Delivered"
    if ([...order.shopStatus.values()].every(status => status === "Delivered")) {
      order.status = "Delivered";
      order.isPaid = true;
    } else {
      order.status = "Partially Delivered";
    }

    await order.save();
    return { status: "OK", message: `Shop ${shopId} đã giao hàng`, data: order };
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

    if (shopId) {
      filter["products"] = { $elemMatch: { shopId: shopId } };
    }

    const orders = await Order.find(filter).populate("products.productId");

    // Nếu có `shopId`, chỉ lấy sản phẩm của shop đó và tính lại tổng tiền
    const filteredOrders = shopId
      ? orders.map(order => {
          const shopProducts = order.products.filter(item => item.shopId.toString() === shopId);

          return {
            ...order.toObject(),
            products: shopProducts,
            orderTotal: shopProducts.reduce((total, item) => total + item.price * item.quantity, 0)
          };
        }).filter(order => order.products.length > 0)
      : orders;

    // Tổng số lượng sản phẩm
    const totalProducts = filteredOrders.reduce(
      (sum, order) => sum + order.products.reduce((acc, item) => acc + item.quantity, 0),
      0
    );

    // Tổng số đơn hàng
    const totalOrders = filteredOrders.length;

    // Tổng tiền của tất cả các đơn (cần kiểm tra `orderTotal` mới tính đúng khi có `shopId`)
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

    let totalRevenue = 0;
    let revenueByShop = {};

    deliveredOrders.forEach(order => {
      order.products.forEach(product => {
        const shopId = product.shopId.toString();
        const revenue = product.price * product.quantity;

        // Cộng tổng doanh thu của từng shop
        if (!revenueByShop[shopId]) {
          revenueByShop[shopId] = 0;
        }
        revenueByShop[shopId] += revenue;

        // Cộng tổng doanh thu toàn bộ
        totalRevenue += revenue;
      });
    });

    return {
      status: "OK",
      message: "Tổng doanh thu của tất cả các Shop",
      totalRevenue,
      revenueByShop
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
    // Truy vấn đơn hàng đã giao có sản phẩm thuộc shopId
    const deliveredOrders = await Order.find({
      status: "Delivered",
      products: { $elemMatch: { shopId: shopId } }
    });

    let totalRevenue = 0;

    deliveredOrders.forEach(order => {
      const shopProducts = order.products.filter(item => item.shopId.toString() === shopId);

      const shopRevenue = shopProducts.reduce(
        (sum, product) => sum + product.price * product.quantity,
        0
      );

      totalRevenue += shopRevenue;
    });

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
