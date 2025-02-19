const Product = require("../models/ProductModel");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const createProduct = async (newProduct) => {
    const {
      name,
      quantityInStock,
      prices,
      discount,
      imageUrls,
      categoryName,
      description,
    } = newProduct;
  
    try {
      const promotionPrice = prices - (prices * (discount || 0)) / 100;
  
      const createdProduct = await Product.create({
        name: name || "",
        quantityInStock: quantityInStock || 0,
        prices: prices || 0,
        discount: discount || 0,
        promotionPrice,
        imageUrls: imageUrls || "",
        categoryName: categoryName || "",
        description: description || "",

      });
  
      return {
        status: "OK",
        message: "Product created successfully",
        data: createdProduct
      };
    } catch (error) {
      throw {
        status: "ERR",
        message: "Failed to create product",
        error: error.message
      };
    }
  };
  module.exports = {
    createProduct,
  };