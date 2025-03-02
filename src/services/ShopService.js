const Shop = require("../models/ShopModel");
const User = require("../models/UserModel");

// Tạo cửa hàng
const createShop = async ({ userId, name, description, logo }) => {
    const user = await User.findById(userId);
    if (!user || (user.role !== 1 && user.role !== 0)) {
        throw { status: 403, message: "Bạn không có quyền tạo cửa hàng!" };
    }

    const existingShop = await Shop.findOne({ ownerId: userId });
    if (existingShop) {
        throw { status: 400, message: "Bạn đã có cửa hàng rồi!" };
    }

    const shop = new Shop({ ownerId: userId, name, description, logo, products: [] });
    await shop.save();

    return shop;
};

// Xóa cửa hàng
const deleteShop = async ({ userId, shopId }) => {
    const user = await User.findById(userId);
    if (!user || (user.role !== 1 && user.role !== 0)) {
        throw { status: 403, message: "Bạn không có quyền xóa cửa hàng!" };
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
        throw { status: 404, message: "Không tìm thấy cửa hàng!" };
    }

    if (user.role !== 0 && shop.ownerId.toString() !== userId) {
        throw { status: 403, message: "Bạn không có quyền xóa cửa hàng này!" };
    }

    await shop.deleteOne();
    return { message: "Xóa cửa hàng thành công!" };
};

// Lấy danh sách cửa hàng
const getAllShops = async () => {
    return await Shop.find().populate("ownerId", "username");
};

// Lấy thông tin chi tiết cửa hàng
const getShopById = async (shopId) => {
    const shop = await Shop.findById(shopId).populate("ownerId", "username");
    if (!shop) {
        throw { status: 404, message: "Không tìm thấy cửa hàng!" };
    }
    return shop;
};

module.exports = {
    createShop,
    deleteShop,
    getAllShops,
    getShopById,
};
