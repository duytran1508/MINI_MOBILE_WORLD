const mongoose = require("mongoose");
const Product = require("../models/ProductModel");
const Category = require("../models/CategoryModel");

const convertToBase64 = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const base64Image = `data:image/jpeg;base64,${data.toString("base64")}`;
        resolve(base64Image);
      }
    });
  });
};

const createProduct = async (newProduct) => {
    const {
      name,
      quantityInStock,
      prices,
      discount,
      imageUrls,
      categoryId,
      description,
    } = newProduct;
  
    try {
      // Kiểm tra giá trị hợp lệ
      if (prices < 0 || discount < 0 || discount > 100) {
        return {
          status: "ERR",
          message: "Giá hoặc giảm giá không hợp lệ"
        };
      }

      // Tính giá khuyến mãi
      const promotionPrice = prices - (prices * (discount || 0)) / 100;
  
      const createdProduct = await Product.create({
        name: name || "",
        quantityInStock: quantityInStock || 0,
        prices: prices || 0,
        discount: discount || 0,
        promotionPrice,
        imageUrls: Array.isArray(imageUrls) ? imageUrls : [], // Đảm bảo là mảng
        categoryId: categoryId || "",
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

const updateProduct = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkProduct = await Product.findById(id);
      if (!checkProduct) {
        return resolve({
          status: "ERR",
          message: "Product not found"
        });
      }

      // Kiểm tra giá trị hợp lệ
      if (data.prices !== undefined && data.prices < 0) {
        return resolve({
          status: "ERR",
          message: "Giá sản phẩm không hợp lệ"
        });
      }
      if (data.discount !== undefined && (data.discount < 0 || data.discount > 100)) {
        return resolve({
          status: "ERR",
          message: "Giảm giá phải từ 0 đến 100%"
        });
      }

      // Nếu có ảnh mới, thay thế ảnh cũ hoàn toàn
      if (data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
        data.imageUrls = [...data.imageUrls]; // Chỉ giữ ảnh mới
      } else {
        data.imageUrls = checkProduct.imageUrls; // Nếu không có ảnh mới, giữ nguyên
      }

      // Cập nhật giá khuyến mãi nếu có
      const prices = data.prices !== undefined ? data.prices : checkProduct.prices;
      const discount = data.discount !== undefined ? data.discount : checkProduct.discount;
      data.promotionPrice = prices - (prices * discount) / 100;

      const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true });

      resolve({
        status: "OK",
        message: "Product updated successfully",
        data: updatedProduct
      });
    } catch (e) {
      reject({
        status: "ERR",
        message: "Error updating product",
        error: e.message
      });
    }
  });
};
const deleteProduct = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkProduct = await Product.findOne({
        _id: id
      });
      if (checkProduct === null) {
        resolve({
          status: "Oke",
          message: "Product is not defined"
        });
      }

      await Product.findByIdAndDelete(id);
      resolve({
        status: "Oke",
        massage: "delete success"
      });
    } catch (e) {
      reject(e);
    }
  });
};

const deleteManyProduct = (ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      await Product.deleteMany({ _id: ids });
      resolve({
        status: "Oke",
        massage: "delete many success"
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getAllProduct = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const allProducts = await Product.find();
      const formattedProducts = allProducts.map((product) => {
        return {
          ...product.toObject(),
        };
      });
      resolve({
        status: "OK",
        message: "success",
        data: formattedProducts,
        total: formattedProducts.length
      });
    } catch (e) {
      reject(e);
    }
  });
};


const getDetailsProduct = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const product = await Product.findOne({
        _id: id
      });
      if (product === null) {
        resolve({
          status: "Oke",
          message: "Product is not defined"
        });
      }
      resolve({
        status: "Oke",
        massage: "success",
        data: product
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getAllProductsByParentCategory = (parentCategoryId) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("📌 parentCategoryId:", parentCategoryId);

      // Kiểm tra nếu parentCategoryId hợp lệ
      if (!mongoose.Types.ObjectId.isValid(parentCategoryId)) {
        return resolve({
          status: "ERR",
          message: "Invalid parentCategoryId format",
        });
      }

      // Kiểm tra danh mục cha có tồn tại không
      const parentCategory = await Category.findById(parentCategoryId);
      if (!parentCategory) {
        return resolve({
          status: "ERR",
          message: "Parent category not found",
        });
      }
      // Lấy danh mục con dựa vào parentCategory
      const subcategories = await Category.find({ parentCategory: new mongoose.Types.ObjectId(parentCategoryId) }).select("_id");
      const subcategoryIds = subcategories.map((sub) => sub._id);
      // Nếu không có danh mục con, trả về mảng rỗng luôn
      if (subcategoryIds.length === 0) {
        return resolve({
          status: "OK",
          message: "No subcategories found",
          data: [],
          total: 0,
        });
      }
      // Tìm tất cả sản phẩm thuộc các danh mục con
      const products = await Product.find({ categoryId: { $in: subcategoryIds } });
      resolve({
        status: "OK",
        message: "Fetched all products in parent category",
        data: products,
        total: products.length,
      });
    } catch (e) {
      console.error("Error fetching products:", e);
      reject({
        status: "ERR",
        message: "An error occurred while fetching products",
        error: e.message,
      });
    }
  });
};

const getAllProductsBySubCategory = (subcategoryId) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("📌 subcategoryId:", subcategoryId);

      // Kiểm tra nếu subcategoryId hợp lệ
      if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
        return resolve({
          status: "ERR",
          message: "Invalid subcategoryId format",
        });
      }

      // Kiểm tra xem danh mục con có tồn tại không
      const subcategory = await Category.findById(subcategoryId);
      if (!subcategory) {
        return resolve({
          status: "ERR",
          message: "Subcategory not found",
        });
      }

      console.log("📌 Subcategory found:", subcategory);

      // Tìm tất cả sản phẩm có category thuộc danh mục con này
      const products = await Product.find({ categoryId: new mongoose.Types.ObjectId(subcategoryId) });

      console.log("📌 Products Found:", products.length);

      resolve({
        status: "OK",
        message: "Fetched all products in subcategory",
        data: products,
        total: products.length,
      });
    } catch (e) {
      console.error("Error fetching products by subcategory:", e);
      reject({
        status: "ERR",
        message: "An error occurred while fetching products",
        error: e.message,
      });
    }
  });
};

const getAllType = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const allType = await Product.distinct("type");
      resolve({
        status: "Oke",
        massage: "success",
        data: allType
      });
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  createProduct,
  updateProduct,
  getDetailsProduct,
  deleteProduct,
  deleteManyProduct,
  getAllProduct,
  getAllType,
  getAllProductsByParentCategory,
  getAllProductsBySubCategory
};
