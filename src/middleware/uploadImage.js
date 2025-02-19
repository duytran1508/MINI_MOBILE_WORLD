const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir;

    if (file.fieldname === "imageFile") {
      uploadDir = path.join(__dirname, "../uploads/images");
    } else if (file.fieldname === "bannerFile") {
      uploadDir = path.join(__dirname, "../uploads/slides");
    } else {
      return cb(new Error("Invalid field name"), null);
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

module.exports = upload;
