const ShopService = require("../services/ShopService");

// Tạo cửa hàng
const createShop = async (req, res) => {
    try {
      const {userId} = req.body;
  
      if (!userId) {
        return res.status(400).json({
          status: "ERR",
          message: "Thiếu thông tin bắt buộc",
        });
      }
  
      const response = await ShopService.createShop(userId);
  
      return res.status(response.status === "OK" ? 200 : 400).json(response);
    } catch (error) {
      return res.status(500).json({
        status: "ERR",
        message: "Lỗi máy chủ: " + error.message,
      });
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

const getunShops = async (req, res) => {
    try {
        const shops = await ShopService.find({ isApproved: false });
        res.status(200).json({ success: true, data: shops });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách shop chưa duyệt", error });
    }
};

const approveShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const updatedShop = await ShopService.findByIdAndUpdate(shopId, { isApproved: true }, { new: true });

        if (!updatedShop) {
            return res.status(404).json({ success: false, message: "Không tìm thấy shop" });
        }

        res.status(200).json({ success: true, message: "Shop đã được duyệt", data: updatedShop });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi duyệt shop", error });
    }
};

module.exports = {
    createShop,
    deleteShop,
    getAllShops,
    getShopById,
    getunShops,
    approveShop
};
