const Category = require("../models/CategoryModel");
const Product = require("../models/ProductModel");

const createCategory = async (newProduct) => {
  const { name, imageUrl } = newProduct;

  try {
    const createdProduct = await Category.create({
      name: name || "",
      imageUrl: imageUrl || ""
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

const getAllCategories = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const categories = await Category.find();
      resolve({
        status: "OK",
        message: "Fetched all categories",
        data: categories
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getCategoryById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const category = await Category.findById(id);
      if (!category) {
        resolve({
          status: "ERR",
          message: "Category not found"
        });
      } else {
        resolve({
          status: "OK",
          message: "Category found",
          data: category
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const updateCategory = (id, categoryData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updatedCategory = await Category.findByIdAndUpdate(
        id,
        categoryData,
        { new: true }
      );
      if (!updatedCategory) {
        resolve({
          status: "ERR",
          message: "Category not found"
        });
      } else {
        resolve({
          status: "OK",
          message: "Category updated successfully",
          data: updatedCategory
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const deleteCategory = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const category = await Category.findById(id);
      if (!category) {
        resolve({
          status: "ERR",
          message: "Category not found"
        });
      } else {
        // Xóa tất cả các sản phẩm có cùng category
        await Product.deleteMany({ category: id });
        // Xóa category
        await Category.findByIdAndDelete(id);
        resolve({
          status: "OK",
          message: "Category and related products deleted successfully"
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
