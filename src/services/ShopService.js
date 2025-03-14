const Shop = require("../models/ShopModel");
const Product = require("../models/ProductModel");

const User = require("../models/UserModel");

// Tạo cửa hàng (shop mới luôn mặc định chưa được duyệt)
const createShop = async (userId, shopData) => {
    try {
      const user = await User.findById(userId);
  
      if (!user) {
        return { status: "ERR", message: "Người dùng không tồn tại" };
      }
  
      if (user.roles !== 1) {
        return { status: "ERR", message: "Bạn không có quyền tạo cửa hàng" };
      }
  
      if (user.shopId) {
        return { status: "ERR", message: "Mỗi người bán chỉ có thể có một cửa hàng" };
      }
  
      const newShop = await Shop.create({
        name: shopData.name,
        description: shopData.description,
        ownerId: userId,
      });
  
      // Cập nhật shopId vào user
      user.shopId = newShop._id;
      await user.save();
  
      return { status: "OK", message: "Tạo cửa hàng thành công", shop: newShop };
    } catch (error) {
      return { status: "ERR", message: "Lỗi máy chủ: " + error.message };
    }
  };
  
// Xóa cửa hàng và tất cả sản phẩm liên quan
const deleteShop = async (shopId) => {
    try {
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return { status: "ERR", message: "Không tìm thấy cửa hàng" };
        }

        // Xóa toàn bộ sản phẩm thuộc cửa hàng này
        await Product.deleteMany({ shopId });

        // Xóa cửa hàng
        await Shop.findByIdAndDelete(shopId);

        return {
            status: "success",
            message: "Xóa cửa hàng thành công!"
        };
    } catch (error) {
        return {
            status: "ERR",
            message: "Lỗi khi xóa cửa hàng: " + error.message
        };
    }
};

// Lấy danh sách tất cả cửa hàng
const getAllShops = async () => {
    try {
        const shops = await Shop.find().populate("ownerId", "name");
        return {
            status: "success",
            message: "Lấy danh sách cửa hàng thành công",
            data: shops
        };
    } catch (error) {
        return {
            status: "ERR",
            message: "Lỗi khi lấy danh sách cửa hàng: " + error.message
        };
    }
};

// Lấy thông tin chi tiết cửa hàng theo ID
const getShopById = async (shopId) => {
    try {
        const shop = await Shop.findById(shopId).populate("ownerId", "name");
        if (!shop) {
            return { status: "ERR", message: "Không tìm thấy cửa hàng" };
        }

        return {
            status: "success",
            message: "Lấy thông tin cửa hàng thành công",
            data: shop
        };
    } catch (error) {
        return {
            status: "ERR",
            message: "Lỗi khi lấy thông tin cửa hàng: " + error.message
        };
    }
};

module.exports = {
    createShop,
    deleteShop,
    getAllShops,
    getShopById,
};
