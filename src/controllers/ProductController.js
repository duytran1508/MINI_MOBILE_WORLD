const ProductService = require("../services/ProductService");
const admin = require("firebase-admin");
const multer = require("multer");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const serviceAccount = require("../config/serviceAccountKey.json");

// Khởi tạo Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();

// Cấu hình Multer (Lưu trữ ảnh trên bộ nhớ)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Cho phép upload nhiều ảnh với key "imageUrls"
const uploadProductImages = upload.array("imageUrls", 5);

const createProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    data.imageUrls = []; // Khởi tạo mảng để lưu link ảnh

    // Kiểm tra nếu có ảnh gửi lên
    if (req.files && req.files.length > 0) {
      for (const imageFile of req.files) {
        const folderName = "TTTN/products";
        const imageFileName = `${folderName}/${Date.now()}-${imageFile.originalname}`;
        const fileUpload = bucket.file(imageFileName);
        const token = uuidv4();

        await fileUpload.save(imageFile.buffer, {
          contentType: imageFile.mimetype,
          metadata: {
            firebaseStorageDownloadTokens: token
          }
        });

        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
          process.env.REACT_APP_FIREBASE_STORAGE_BUCKET
        }/o/${encodeURIComponent(imageFileName)}?alt=media&token=${token}`;

        data.imageUrls.push(imageUrl); // Thêm ảnh vào mảng
      }
    }

    // Gọi service để tạo sản phẩm
    const result = await ProductService.createProduct(data);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Đã xảy ra lỗi khi thêm sản phẩm: " + error.message);
  }
};

module.exports = {
  uploadProductImages,
  createProduct
};
