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
  try {
      const { name, quantityInStock, prices, discount = 0, imageUrls, categoryId, shopId, description } = newProduct;

      // Kiểm tra trường bắt buộc
      if (!name || !prices || !categoryId || !shopId) {
          return {
              status: "ERR",
              message: "Thiếu thông tin bắt buộc (name, prices, categoryId, shopId)"
          };
      }

      // Tính toán giá khuyến mãi (nếu có giảm giá)
      const promotionPrice = prices - (prices * discount) / 100;

      // Tạo sản phẩm mới
      const createdProduct = await Product.create({
          name,
          quantityInStock: quantityInStock ?? 0,
          prices,
          discount,
          promotionPrice,
          imageUrls: imageUrls ?? [],
          categoryId,
          shopId,  // 🔥 Đảm bảo sản phẩm thuộc một shop cụ thể
          description: description || ""
      });

      return {
          status: "OK",
          message: "Sản phẩm đã được tạo thành công",
          data: createdProduct
      };
  } catch (error) {
      return {
          status: "ERR",
          message: "Lỗi khi tạo sản phẩm",
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
          const allProducts = await Product.find()
              .populate("categoryId", "name") // Lấy thông tin danh mục
              .populate("shopId", "name");   // Lấy thông tin cửa hàng

          resolve({
              status: "OK",
              message: "Lấy danh sách sản phẩm thành công!",
              data: allProducts,
              total: allProducts.length
          });
      } catch (e) {
          reject({
              status: "ERR",
              message: "Lỗi khi lấy danh sách sản phẩm!",
              error: e.message
          });
      }
  });
};



const getDetailsProduct = (id) => {
  return new Promise(async (resolve, reject) => {
      try {
          const product = await Product.findById(id)
              .populate("categoryId", "name")
              .populate("shopId", "name ownerId");

          if (!product) {
              return resolve({
                  status: "ERR",
                  message: "Sản phẩm không tồn tại!"
              });
          }

          resolve({
              status: "OK",
              message: "Lấy chi tiết sản phẩm thành công!",
              data: product
          });
      } catch (e) {
          reject({
              status: "ERR",
              message: "Lỗi khi lấy chi tiết sản phẩm!",
              error: e.message
          });
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
