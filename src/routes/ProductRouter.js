const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");
// const { authMiddleWare } = require("../middleware/authMiddleware");

router.post(
  "/create",productController.uploadProductImages,productController.createProduct);

module.exports = router;
