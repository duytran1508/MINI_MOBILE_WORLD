const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json"); // Cập nhật đường dẫn nếu cần

// Kiểm tra xem Firebase đã được khởi tạo chưa, nếu chưa thì mới khởi tạo
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET, // Định danh bucket từ biến môi trường
  });
}

const bucket = admin.storage().bucket();

module.exports = { admin, bucket };
