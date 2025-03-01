const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");
// const { authMiddleWare } = require("../middleware/authMiddleware");

router.post("/create",productController.uploadProductImages,productController.createProduct);
router.put("/update/:id",productController.uploadProductImages,productController.updateProduct);
router.get("/get-details/:id", productController.getDetailsProduct);
router.delete("/delete-product/:id", productController.deleteProduct);
router.get("/getAllProduct", productController.getAllProduct);
router.get("/getallproducttype/:id", productController.getAllProductsByParentCategory);
router.get("/getallproductsub/:id", productController.getAllProductsBySubCategory);

router.get("/get-type", productController.getAllType);

module.exports = router;
