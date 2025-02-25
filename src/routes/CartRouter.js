const express = require("express");
const CartController = require("../controllers/CartController");

const router = express.Router();

router.post("/add-update", CartController.addOrUpdateProductInCart);
router.post("/update", CartController.UpdateProductInCart);

router.get("/get-cart/:userId", CartController.getCartByUserId);

router.delete("/delete-product-cart/:userId/product/:productId",CartController.removeProductFromCart);

router.delete("/delete-cart/:userId", CartController.deleteCart);

module.exports = router;
