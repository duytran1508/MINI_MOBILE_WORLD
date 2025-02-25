const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/VoucherController");

router.post("/create", voucherController.createVoucher);
router.post("/check", voucherController.checkVoucher);
router.get("/list", voucherController.listVouchers);
module.exports = router;
