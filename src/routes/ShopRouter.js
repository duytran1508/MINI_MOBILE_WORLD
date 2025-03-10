const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const ShopController = require("../controllers/ShopController");
const  {authUserMiddleWare}  = require("../middleware/authMiddleware");


router.post("/create/:id",authUserMiddleWare,upload.none(),ShopController.createShop);  // Tạo cửa hàng
router.delete("/delete/:shopId", ShopController.deleteShop);  // Xóa cửa hàng
router.get("/getall", ShopController.getAllShops);  // Lấy danh sách cửa hàng
router.get("/get-shop/:shopId", ShopController.getShopById);  // Lấy chi tiết 1 cửa hàng



module.exports = router;
