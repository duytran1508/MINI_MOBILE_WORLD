const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/PaymentController");

router.post("/create_payment", PaymentController.createPayment);
router.get("/callback", PaymentController.handleVNPayCallback);
router.put("/update-status", PaymentController.updatePaymentStatus);

// Route tạo thanh toán PayPal
router.post("/paypal/create_payment", PaymentController.createPaypalPayment);

// Route xử lý khi thanh toán thành công
router.get("/paypal_return", PaymentController.handlePaypalReturn);

// Route xử lý khi hủy thanh toán
router.get("/paypal_cancel", PaymentController.handlePaypalCancel);


module.exports = router;
