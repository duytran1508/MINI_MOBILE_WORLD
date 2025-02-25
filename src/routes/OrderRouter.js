const express = require("express");
const router = express.Router();
const orderController = require("../controllers/OrderController");
const { authUserMiddleWare } = require("../middleware/authMiddleware");

router.post("/create", orderController.createOrder);

router.get("/get/:orderId", orderController.getOrderById);

router.get("/getAll/:userId", orderController.getAllOrdersByUser);

router.get("/getAll", orderController.getAllOrders);

router.put("/cancel", orderController.cancelOrder);

// Route để admin xác nhận đơn hàng (chuyển từ Pending sang Shipped)
router.put("/ship", orderController.shipOrder);

// Route để người dùng xác nhận đã nhận hàng (chuyển từ Shipped sang Delivered)
router.put("/deliver", orderController.deliverOrder);

router.post("/getstatus", orderController.getOrdersByStatusAndDateController);
router.get("/total-revenue", orderController.getRevenue);
module.exports = router;
