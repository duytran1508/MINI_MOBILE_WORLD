const ShopService = require("../services/ShopService");

// Tạo cửa hàng
const createShop = async (req, res) => {
    try {
        const shop = await ShopService.createShop(req.body);
        res.status(201).json({ message: "Tạo cửa hàng thành công!", shop });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || "Lỗi server" });
    }
};

// Xóa cửa hàng
const deleteShop = async (req, res) => {
    try {
        const response = await ShopService.deleteShop({ userId: req.body.userId, shopId: req.params.shopId });
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
