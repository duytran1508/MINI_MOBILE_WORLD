const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const authUserMiddleWare = (req, res, next) => {
  try {
    // Lấy token từ header
    const token = req.headers.token?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized! Please log in." });
    }

    // Xác thực token
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token!" });
      }

      // Giải mã token lấy ID và roles
      const { id, roles } = decoded.payload;

      if (!id) {
        return res.status(403).json({ message: "Invalid token data!" });
      }

      // Lấy userId từ request (ưu tiên theo thứ tự: params -> body -> query)
      const userId = req.params.id || req.body.userId || req.query.userId;

      console.log(`✅ Token ID: ${id}, Roles: ${roles}, Requested ID: ${userId}`);

      // Kiểm tra quyền: Admin (roles === 0) hoặc chính chủ user (id === userId)
      if (roles === 0 || id === userId) {
        req.user = { id, roles }; // Gán thông tin user vào request
        return next(); // Cho phép tiếp tục xử lý
      }

      return res.status(403).json({ message: "Access denied!" });
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
  authUserMiddleWare,
  authAdminMiddleware,
};
