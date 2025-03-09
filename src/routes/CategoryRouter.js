const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// Tạo danh mục mới
router.post("/create", categoryController.uploadCategoryImages, categoryController.createCategory);

// Cập nhật danh mục
router.put("/update/:id", categoryController.updateCategory);

// Lấy thông tin chi tiết danh mục
router.get("/get-details/:id", categoryController.getCategoryById);

// Xóa danh mục
router.delete("/delete/:id", categoryController.deleteCategory);

// Lấy danh sách tất cả danh mục
router.get("/getAll", categoryController.getAllCategories);

// Lấy danh mục cha
router.get("/get-parents", categoryController.getAllParentCategories);

// Lấy danh mục con theo danh mục cha
router.get("/get-subcategories/:id", categoryController.getAllSubcategories);

module.exports = router;
