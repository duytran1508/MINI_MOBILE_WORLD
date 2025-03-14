const ShopService = require("../services/ShopService");


// Tạo cửa hàng
const createShop = async (req, res) => {
    try {
        console.log("User data from token:", req.user);
        console.log("Dữ liệu từ request:", req.body); // Debug dữ liệu
      const userId = req.params.id; // Lấy userId từ token nếu có auth
      const response = await ShopService.createShop(userId, req.body);
      return res.status(response.status === "OK" ? 201 : 400).json(response);
    } catch (error) {
      return res.status(500).json({ status: "ERR", message: "Lỗi máy chủ: " + error.message });
    }
  };
// Xóa cửa hàng (không cần kiểm tra quyền, đã có middleware)
const deleteShop = async (req, res) => {
    try {
        const response = await ShopService.deleteShop(req.params.shopId);
        res.status(200).json(response);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || "Lỗi server" });
    }
};
// Lấy danh sách cửa hàng
const getAllShops = async (req, res) => {
    try {
        const shops = await ShopService.getAllShops();
        res.status(200).json(shops);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
};
// Lấy thông tin chi tiết cửa hàng
const getShopById = async (req, res) => {
    try {
        const shop = await ShopService.getShopById(req.params.shopId);
        res.status(200).json(shop);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || "Lỗi server" });
    }
};

module.exports = {
    createShop,
    deleteShop,
    getAllShops,
    getShopById,
};
