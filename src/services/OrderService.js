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

    // Nhóm sản phẩm theo `shopId`
    const productsByShop = {};
    cart.products.forEach((item) => {
      if (productIds.includes(String(item.productId._id))) {
        const shopId = item.productId.shopId.toString();
        if (!productsByShop[shopId]) {
          productsByShop[shopId] = [];
        }
        if (item.quantity > item.productId.quantityInStock) {
          throw {
            status: "FAIL",
            message: `Sản phẩm ${item.productId._id} không đủ hàng trong kho!`
          };
        }
        productsByShop[shopId].push({
          productId: item.productId._id,
          shopId: shopId,
          quantity: item.quantity,
          price: item.productId.promotionPrice || item.productId.price,
        });
      }
    });

    // Lưu danh sách các đơn hàng được tạo
    const createdOrders = [];

    // Lặp qua từng `shopId` để tạo đơn hàng riêng biệt
    for (const shopId in productsByShop) {
      const products = productsByShop[shopId];

      // Tính tổng giá trị đơn hàng của từng shop
      const totalPrice = products.reduce(
        (total, product) => total + product.price * product.quantity,
        0
      );

      const VAT = totalPrice * 0.1;
      const shippingFee = totalPrice >= 50000000 ? 0 : 800000;

      // Áp dụng mã giảm giá (nếu có)
      let discount = 0;
      if (voucherCode) {
        const voucher = await Voucher.findOne({ code: voucherCode });
        if (voucher && voucher.discount > 0 && voucher.discount <= 100) {
          discount = (totalPrice + shippingFee + VAT) * (voucher.discount / 100);
        }
      }

      const orderTotal = totalPrice + shippingFee + VAT - discount;

      // Tạo đơn hàng riêng cho từng shop
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
      });

      await newOrder.save();
      createdOrders.push(newOrder);
    }

    // Cập nhật giỏ hàng: Xóa các sản phẩm đã đặt từ giỏ hàng
    cart.products = cart.products.filter(
      (item) => !productIds.includes(String(item.productId._id))
    );
    await cart.save();

    return {
      status: "OK",
      message: "Đã tạo đơn hàng thành công cho từng shop",
      orders: createdOrders
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
    // Lọc đơn hàng có ít nhất một sản phẩm của shopId
    const orders = await Order.find({ "products.shopId": shopId }).populate("products.productId");

    // Lọc sản phẩm chỉ lấy sản phẩm thuộc shopId
    const filteredOrders = orders.map(order => {
      const shopProducts = order.products.filter(item => item.shopId.toString() === shopId);

      return {
        ...order.toObject(), 
        products: shopProducts // Chỉ giữ lại sản phẩm thuộc shop
      };
    }).filter(order => order.products.length > 0); // Bỏ đơn hàng không có sản phẩm của shop

    return filteredOrders;
  } catch (error) {
    console.error("Lỗi khi lấy đơn hàng của shop:", error);
    throw new Error("Lỗi khi lấy đơn hàng của shop: " + error.message);
  }
};
const shipOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate("products.productId");

    if (!order) {
      return { status: "FAIL", message: "Không tìm thấy đơn hàng" };
    }

    // Kiểm tra số lượng tồn kho trước khi giao
    order.products.forEach((item) => {
      if (item.productId.quantityInStock < item.quantity) {
        throw { status: 400, message: `Sản phẩm ${item.productId.name} không đủ số lượng tồn kho` };
      }
    });

    // Cập nhật số lượng tồn kho
    order.products.forEach((item) => {
      item.productId.quantityInStock -= item.quantity;
      item.productId.soldQuantity += item.quantity;
      item.productId.save();
    });

    // Cập nhật trạng thái đơn hàng
    order.status = "Shipped";

    await order.save();
    return { status: "OK", message: "Đơn hàng đã được giao thành công", data: order };
  } catch (error) {
    console.error("Lỗi trong shipOrder service:", error);
    return { status: "FAIL", message: "Lỗi hệ thống" };
  }
};
const cancelOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) throw { status: 404, message: 'Không tìm thấy đơn hàng' };

    // Cập nhật trạng thái đơn hàng thành "Cancelled"
    order.status = "Cancelled";
    await order.save();

    return { status: "OK", message: "Đơn hàng đã bị hủy", data: order };
  } catch (error) {
    throw { status: error.status || 500, message: error.message || 'Lỗi hệ thống' };
  }
};
const deliverOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) throw { status: 404, message: 'Không tìm thấy đơn hàng' };

    // Kiểm tra trạng thái đơn hàng có phải là "Shipped" không
    if (order.status !== "Shipped") {
      return { status: "FAIL", message: "Đơn hàng chưa được giao đầy đủ" };
    }

    // Cập nhật trạng thái đơn hàng thành "Delivered" và đã thanh toán
    order.status = "Delivered";
    order.isPaid = true;

    await order.save();
    return { status: "OK", message: "Đơn hàng đã được giao thành công", data: order };
  } catch (error) {
    console.error("Lỗi trong deliverOrder service:", error);
    throw { status: error.status || 500, message: error.message || 'Lỗi hệ thống' };
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
  getOrdersByTimePeriod,
  getTotalRevenueAllShops,
  getTotalRevenueByShop,
};
