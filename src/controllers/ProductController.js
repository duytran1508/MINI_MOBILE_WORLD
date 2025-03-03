const ProductService = require("../services/ProductService");
const admin = require("firebase-admin");
const multer = require("multer");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const serviceAccount = require("../config/serviceAccountKey.json");
const Product = require("../models/ProductModel");
const mongoose = require("mongoose")

// Khởi tạo Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();

// Cấu hình Multer (Lưu trữ ảnh trên bộ nhớ)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Cho phép upload nhiều ảnh với key "images"
const uploadProductImages = upload.array("images", 5);

/**
 * Tạo sản phẩm mới
 */
const createProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    data.imageUrls = [];

    // Kiểm tra nếu thiếu shopId
    if (!data.shopId) {
      return res.status(400).json({ status: "ERR", message: "Thiếu shopId" });
    }

    // Kiểm tra shopId có tồn tại không
    const shopExists = await Shop.findById(data.shopId);
    if (!shopExists) {
      return res.status(404).json({ status: "ERR", message: "Cửa hàng không tồn tại" });
    }

    // Xử lý upload ảnh lên Firebase Storage
    if (req.files && req.files.length > 0) {
      for (const imageFile of req.files) {
        const folderName = "TTTN/products";
        const imageFileName = `${folderName}/${Date.now()}-${imageFile.originalname}`;
        const fileUpload = bucket.file(imageFileName);
        const token = uuidv4();

        await fileUpload.save(imageFile.buffer, {
          contentType: imageFile.mimetype,
          metadata: { firebaseStorageDownloadTokens: token }
        });

        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.REACT_APP_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(imageFileName)}?alt=media&token=${token}`;

        data.imageUrls.push(imageUrl);
      }
    }

    // Gọi service để tạo sản phẩm
    const result = await ProductService.createProduct(data);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ status: "ERR", message: "Error creating product", error: error.message });
  }
};


/**
 * Cập nhật sản phẩm
 */
const updateProduct = async (req, res) => {
  const dataUpdate = { ...req.body };

  if (Object.keys(dataUpdate).length === 0 && (!req.files || req.files.length === 0)) {
    return res.status(400).json({ message: "Không có dữ liệu để cập nhật" });
  }

  try {
    const productId = req.params.id;
    if (!productId) {
      return res.status(400).json({ status: "ERR", message: "Product ID is required." });
    }

    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ status: "ERR", message: "Product not found" });
    }

    const uploadedImages = req.files && req.files.length > 0 ? await uploadNewImages(req.files) : [];

    // Nếu có ảnh mới → Xóa ảnh cũ trên Firebase Storage
    if (uploadedImages.length > 0 && existingProduct.imageUrls && existingProduct.imageUrls.length > 0) {
      await deleteOldImages(existingProduct.imageUrls);
    }

    // Nếu có ảnh mới, thay thế ảnh cũ hoàn toàn, nếu không giữ nguyên
    const updatedImageUrls = uploadedImages.length > 0 ? uploadedImages : existingProduct.imageUrls;
    const updatedProductData = { ...dataUpdate, imageUrls: updatedImageUrls };

    const result = await ProductService.updateProduct(productId, updatedProductData);

    if (result.status === "ERR") {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ status: "ERR", message: "Error updating product", error: error.message });
  }
};

const deleteOldImages = async (imageUrls) => {
  const deletePromises = imageUrls.map(async (oldImageUrl) => {
    const fileName = decodeURIComponent(oldImageUrl.split("/o/")[1].split("?alt=")[0]);
    await bucket.file(fileName).delete().catch(err => console.log("Không thể xóa ảnh cũ:", err));
  });
  await Promise.all(deletePromises);
};

const uploadNewImages = async (files) => {
  const folderName = "TTTN/products";
  const uploadPromises = files.map(async (imageFile) => {
    const imageFileName = `${folderName}/${Date.now()}-${imageFile.originalname}`;
    const fileUpload = bucket.file(imageFileName);
    const token = uuidv4();

    await fileUpload.save(imageFile.buffer, {
      contentType: imageFile.mimetype,
      metadata: { firebaseStorageDownloadTokens: token }
    });

    return `https://firebasestorage.googleapis.com/v0/b/${process.env.REACT_APP_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(imageFileName)}?alt=media&token=${token}`;
  });

  return await Promise.all(uploadPromises);
};
const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      return res.status(200).json({
        status: "ERR",
        message: "the userId is required "
      });
    }
    const response = await ProductService.deleteProduct(productId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e
    });
  }
};

const deleteManyProduct = async (req, res) => {
  try {
    const ids = req.body;
    if (!ids) {
      return res.status(200).json({
        status: "ERR",
        message: "the ids is required "
      });
    }
    const response = await ProductService.deleteManyProduct(ids);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e
    });
  }
};

const getAllProduct = async (req, res) => {
  try {
      const { shopId, categoryId } = req.query; // Thêm điều kiện lọc nếu có
      const response = await ProductService.getAllProduct(shopId, categoryId);
      return res.status(200).json(response);
  } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm:", error);
      return res.status(500).json({
          status: "ERR",
          message: "Lỗi khi lấy danh sách sản phẩm!",
          error: error.message
      });
  }
};


const getDetailsProduct = async (req, res) => {
  try {
      const productId = req.params.id;
      if (!productId) {
          return res.status(400).json({
              status: "ERR",
              message: "Thiếu productId!"
          });
      }

      const response = await ProductService.getDetailsProduct(productId);
      
      if (response.status === "ERR") {
          return res.status(404).json(response);
      }

      return res.status(200).json(response);
  } catch (error) {
      console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
      return res.status(500).json({
          status: "ERR",
          message: "Lỗi server khi lấy sản phẩm!",
          error: error.message
      });
  }
};


const getAllProductsByParentCategory = async (req, res) => {
  try {
    const { id: parentCategoryId } = req.params;

    if (!parentCategoryId) {
      return res.status(400).json({ status: "ERR", message: "The parentCategoryId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(parentCategoryId)) {
      return res.status(400).json({ status: "ERR", message: "Invalid parentCategoryId format" });
    }

    console.log("parentCategoryId:", parentCategoryId); // Debug ID

    const response = await ProductService.getAllProductsByParentCategory(parentCategoryId);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching products by parent category:", error);
    return res.status(500).json({ message: "An error occurred", error: error.message });
  }
};


const getAllProductsBySubCategory = async (req, res) => {
  try {
    const { id: subcategoryId } = req.params;

    if (!subcategoryId) {
      return res.status(400).json({ status: "ERR", message: "The subcategoryId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({ status: "ERR", message: "Invalid subcategoryId format" });
    }

    console.log("subcategoryId:", subcategoryId); // Debug ID

    const response = await ProductService.getAllProductsBySubCategory(subcategoryId);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching products by subcategory:", error);
    return res.status(500).json({ message: "An error occurred while fetching products by subcategory.", error: error.message });
  }
};

const getAllType = async (req, res) => {
  try {
    const response = await ProductService.getAllType();
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e
    });
  }
};


module.exports = {
  uploadProductImages,
  createProduct,
  updateProduct,
  getDetailsProduct,
  deleteProduct,
  deleteManyProduct,
  getAllProduct,
  getAllProductsByParentCategory,
  getAllProductsBySubCategory,
  getAllType
};
