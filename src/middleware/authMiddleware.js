const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const authMiddleWare = (req, res, next) => {
  const token = req.headers.token?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Không có token, truy cập bị từ chối",
      status: "ERROR",
    });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
    if (err) {
      return res.status(404).json({
        message: "Token không hợp lệ",
        status: "ERROR"
      });
    }
    const { payload } = user;
    if (payload?.roles === 0) {
      next();
    } else {
      return res.status(404).json({
        message: "Bạn không phải là ADMIN",
        status: "ERROR"
      });
    }
  });
};

const authUserMiddleWare = (req, res, next) => {
  try {
    const token = req.headers.token?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized! Please log in." });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token!" });
      }

      const { id, roles } = decoded.payload; // Lấy id và roles từ token
      const userId = req.params.id; // ID của user trong request

      console.log(`Token ID: ${id}, Roles: ${roles}, Requested ID: ${userId}`);

      if (roles === 0 || id === userId) {
        next(); // Cho phép admin hoặc chính user đó
      } else {
        return res.status(403).json({ message: "Access denied!" });
      }
    });
  } catch (error) {
    console.error("Token authentication error:", error.message);
    return res.status(401).json({ message: "Invalid token!" });
  }
};


const authAdminMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.token; // Lấy token từ header 'token'
    console.log("Token received:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized! Please log in." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);

    console.log("Decoded Token:", decoded); // Log để kiểm tra

    // Kiểm tra xem có payload không
    if (!decoded.payload || decoded.payload.roles === undefined) {
      return res.status(403).json({ message: "Invalid token format!" });
    }

    // Chỉ cho phép Admin (roles = 0)
    if (decoded.payload.roles !== 0) {
      return res.status(403).json({ message: "Access denied! Admins only." });
    }

    req.user = decoded.payload;
    next();
  } catch (error) {
    console.error("Token authentication error:", error.message);
    return res.status(401).json({ message: "Invalid token!" });
  }
};


module.exports = {
  authMiddleWare,
  authUserMiddleWare,
  authAdminMiddleware,
};
