const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/CategoryController");

router.post("/create",categoryController.uploadCategoryImages,categoryController.createCategory);
router.put("/update/:id", categoryController.updateCategory);
router.get("/get-details/:id", categoryController.getCategoryById);
router.delete("/delete/:id", categoryController.deleteCategory);
router.get("/getAll", categoryController.getAllCategories);
router.get("/get-parents", categoryController.getAllParentCategories);
router.get("/get-subcategories/:parentId", categoryController.getAllSubcategories);



module.exports = router;
