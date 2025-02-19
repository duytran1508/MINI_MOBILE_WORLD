const express = require("express");
const router = express.Router();
const AddressController = require("../controllers/AddressController");

// Routes
router.post("/create", AddressController.createAddress);
router.get("/list/:userId", AddressController.getAddresses);
router.delete("/delete/:userId/:addressId", AddressController.deleteAddress);
module.exports = router;
