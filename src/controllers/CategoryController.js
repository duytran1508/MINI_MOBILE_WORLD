const CategoryService = require("../services/CategoryService");

const admin = require("firebase-admin");
const multer = require("multer");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const serviceAccount = require("../config/serviceAccountKey.json");

if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://<your-database-name>.firebaseio.com"
    });
  }

const bucket = admin.storage().bucket();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadCategoryImages = upload.fields([{ name: "image", maxCount: 2 }]);

const createCategory = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files) {
      if (req.files["image"] && req.files["image"].length > 0) {
        const imageFile = req.files["image"][0];
        const folderName = "TTTN/category";
        const imageName = `${folderName}/${Date.now()}-${
          imageFile.originalname
        }`;
        const fileUpload = bucket.file(imageName);
        const token = uuidv4();

        await fileUpload.save(imageFile.buffer, {
          contentType: imageFile.mimetype,
          metadata: {
            firebaseStorageDownloadTokens: token
          }
        });

        data.imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
          process.env.REACT_APP_FIREBASE_STORAGE_BUCKET
        }/o/${encodeURIComponent(imageName)}?alt=media&token=${token}`;
      }
    }

    const result = await CategoryService.createCategory(data);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Đã xảy ra lỗi khi thêm sản phẩm: " + error.message);
  }
};

const getAllCategories = async (req, res) => {
  try {
    const result = await CategoryService.getAllCategories();
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ status: "ERR", message: e.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const result = await CategoryService.getCategoryById(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ status: "ERR", message: e.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const result = await CategoryService.updateCategory(
      req.params.id,
      req.body
    );
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ status: "ERR", message: e.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const result = await CategoryService.deleteCategory(req.params.id);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ status: "ERR", message: e.message });
  }
};

module.exports = {
  uploadCategoryImages,
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
