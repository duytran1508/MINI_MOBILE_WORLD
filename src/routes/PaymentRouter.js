const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/PaymentController");

router.post("/create_payment", PaymentController.createPayment);
router.get("/callback", PaymentController.handleVNPayCallback);
router.put("/update-status", PaymentController.updatePaymentStatus);

module.exports = router;
