const express = require("express");
const router = express.Router();
const ShopController = require("../controllers/ShopController");
const  {authUserMiddleWare}  = require("../middleware/authMiddleware");


router.post("/create/:id",authUserMiddleWare,ShopController.createShop);  // Tạo cửa hàng
router.delete("/delete/:shopId", ShopController.deleteShop);  // Xóa cửa hàng
router.get("/getall", ShopController.getAllShops);  // Lấy danh sách cửa hàng
router.get("/get-shop/:shopId", ShopController.getShopById);  // Lấy chi tiết 1 cửa hàng
router.get("/unapproved", ShopController.getunShops);// API lấy danh sách shop chưa duyệt
router.put("/approve/:shopId", ShopController.approveShop);// API duyệt shop (admin)


module.exports = router;
