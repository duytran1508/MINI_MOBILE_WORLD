const express = require("express");
const router = express.Router();
const orderController = require("../controllers/OrderController");

router.post("/create", orderController.createOrder);
router.get("/get/:orderId", orderController.getOrderById);
router.get("/getAllByOrder/:userId", orderController.getAllOrdersByUser);
router.get("/getAllByShop/:shopId", orderController.getAllOrdersByShop);
router.get("/getAll", orderController.getAllOrders);
router.put("/cancel", orderController.cancelOrder);
router.put("/ship", orderController.shipOrder);// Route để admin xác nhận đơn hàng (chuyển từ Pending sang Shipped)
router.put("/deliver", orderController.deliverOrder);// Route để người dùng xác nhận đã nhận hàng (chuyển từ Shipped sang Delivered)
router.get("/orders/all-shops", orderController.getOrdersByTimePeriodAllShops);// Lấy đơn hàng của tất cả các Shop
router.get("/orders/by-shop", orderController.getOrdersByTimePeriodByShop);// Lấy đơn hàng theo từng Shop
router.get("/revenue/all", orderController.getTotalRevenueAllShops);       // Tổng doanh thu tất cả các Shop
router.get("/revenue/shop/:shopId", orderController.getTotalRevenueByShop); // Tổng doanh thu theo shopId

module.exports = router;
