const express = require("express");
const router = express.Router();
const ShopController = require("../controllers/ShopController");

router.post("/create", ShopController.createShop);  // Tạo cửa hàng
router.delete("/delete/:shopId", ShopController.deleteShop);  // Xóa cửa hàng
router.get("/getall", ShopController.getAllShops);  // Lấy danh sách cửa hàng
router.get("/get-shop/:shopId", ShopController.getShopById);  // Lấy chi tiết 1 cửa hàng

module.exports = router;
