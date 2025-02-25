const Product = require("../models/ProductModel");

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
  getAllType
};
