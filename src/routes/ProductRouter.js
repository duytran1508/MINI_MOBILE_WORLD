const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");

// Tạo sản phẩm mới
router.post("/create", productController.uploadProductImages, productController.createProduct);

// Cập nhật sản phẩm
router.put("/update/:id", productController.uploadProductImages, productController.updateProduct);

// Lấy thông tin chi tiết sản phẩm
router.get("/get-details/:id", productController.getDetailsProduct);

// Xóa sản phẩm
router.delete("/delete-product/:id", productController.deleteProduct);

// Lấy danh sách tất cả sản phẩm
router.get("/getAllProduct", productController.getAllProduct);

// Lấy danh sách sản phẩm theo danh mục cha
router.get("/getallproducttype/:id", productController.getAllProductsByParentCategory);

// Lấy danh sách sản phẩm theo danh mục con
router.get("/getallproductsub/:id", productController.getAllProductsBySubCategory);

// Lấy danh sách tất cả sản phẩm của một shop
router.get("/getAllByShop/:shopId", productController.getAllProductsByShop);

// Lấy tất cả các loại sản phẩm
router.get("/get-type", productController.getAllType);

module.exports = router;
