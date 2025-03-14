const Category = require("../models/CategoryModel");
const Product = require("../models/ProductModel");
const mongoose = require("mongoose");


const createCategory = async (newCategory) => {
  const { name, parentCategory } = newCategory;

  try {
    // Kiểm tra nếu có parentCategory thì phải đảm bảo danh mục cha tồn tại
    let parent = null;
    if (parentCategory) {
      parent = await Category.findById(parentCategory);
      if (!parent) {
        throw {
          status: "ERR",
          message: "Danh mục cha không tồn tại"
        };
      }
    }

    // Tạo danh mục mới
    const createdCategory = await Category.create({
      name: name || "",
      parentCategory: parent ? parent._id : null // Nếu có parent thì lưu ID, nếu không thì null
    });

    return {
      status: "OK",
      message: "Category created successfully",
      data: createdCategory
    };
  } catch (error) {
    throw {
      status: "ERR",
      message: "Failed to create category",
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
const getAllParentCategories = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Tìm tất cả danh mục KHÔNG có parentCategory (tức là danh mục gốc)
      const parentCategories = await Category.find({ parentCategory: null });

      resolve({
        status: "OK",
        message: "Fetched all parent categories",
        data: parentCategories
      });
    } catch (e) {
      reject(e);
    }
  });
};


const getAllSubcategories = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("📌 Parent Category ID:", id);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return resolve({ status: "ERR", message: "Invalid parent category ID" });
      }

      // Kiểm tra danh mục cha có tồn tại không
      const parentCategory = await Category.findById(id);
      if (!parentCategory) {
        return resolve({ status: "ERR", message: "Parent category not found" });
      }

      // Tìm tất cả danh mục con
      const subcategories = await Category.find({ parentCategory: new mongoose.Types.ObjectId(id) });

      console.log("📌 Subcategories Found:", subcategories);

      resolve({
        status: "OK",
        message: subcategories.length ? "Fetched all subcategories" : "No subcategories found",
        data: subcategories
      });
    } catch (e) {
      reject(e);
    }
  });
};



const updateCategory = (id, categoryData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const existingCategory = await Category.findById(id);
      if (!existingCategory) {
        return resolve({ status: "ERR", message: "Category not found" });
      }

      const { name, parentCategory } = categoryData;

      // Kiểm tra nếu không có parentCategory -> Báo lỗi
      if (!parentCategory) {
        return resolve({ status: "ERR", message: "Parent category is required" });
      }

      // Kiểm tra nếu parentCategory tồn tại
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return resolve({ status: "ERR", message: "Parent category not found" });
      }

      // Cập nhật danh mục
      const updatedCategory = await Category.findByIdAndUpdate(
        id,
        { name, parentCategory },
        { new: true }
      );

      resolve({ status: "OK", message: "Category updated successfully", data: updatedCategory });
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
  getAllParentCategories,
  getAllSubcategories,
  updateCategory,
  deleteCategory
};
