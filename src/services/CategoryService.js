const Category = require("../models/CategoryModel");
const Product = require("../models/ProductModel");

const createCategory = async (newCategory) => {
  const { name, icon, type } = newCategory;

  try {
    // Kiểm tra nếu có type thì phải đảm bảo danh mục cha tồn tại
    let parent = null;
    if (type) {
      parent = await Category.findById(type);
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
      icon: icon || "",
      type: parent ? parent._id : null // Nếu có parent thì lưu ID, nếu không thì null
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
      // Tìm tất cả danh mục KHÔNG có type (tức là danh mục gốc)
      const parentCategories = await Category.find({ type: null });

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


const getAllSubcategories = (parentId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Kiểm tra danh mục cha có tồn tại không
      const type = await Category.findById(parentId);
      if (!type) {
        return resolve({
          status: "ERR",
          message: "Parent category not found"
        });
      }

      // Tìm tất cả danh mục có `type` là `parentId`
      const subcategories = await Category.find({ type: parentId });

      resolve({
        status: "OK",
        message: "Fetched all subcategories",
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

      const { name, icon, type } = categoryData;

      // Kiểm tra nếu không có type -> Báo lỗi
      if (!type) {
        return resolve({ status: "ERR", message: "Parent category is required" });
      }

      // Kiểm tra nếu type tồn tại
      const parentExists = await Category.findById(type);
      if (!parentExists) {
        return resolve({ status: "ERR", message: "Parent category not found" });
      }

      // Cập nhật danh mục
      const updatedCategory = await Category.findByIdAndUpdate(
        id,
        { name, icon, type },
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
