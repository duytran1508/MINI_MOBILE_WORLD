const Shop = require("../models/ShopModel");
const Product = require("../models/ProductModel");

// Tạo cửa hàng (shop mới luôn mặc định chưa được duyệt)
const createShop = async (shopData) => {
    try {
        const newShop = new Shop(shopData);
        await newShop.save();

        return {
            status: "success",
            message: "Cửa hàng đã được tạo, chờ xét duyệt từ admin",
            data: newShop
        };
    } catch (error) {
        return {
            status: "ERR",
            message: "Đã có lỗi xảy ra khi tạo cửa hàng: " + error.message
        };
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

// Lấy danh sách cửa hàng chưa duyệt
const getunShops = async () => {
    try {
        const shops = await Shop.find({ isApproved: false }).populate("ownerId", "name");
        return {
            status: "success",
            message: "Lấy danh sách cửa hàng chưa duyệt thành công",
            data: shops
        };
    } catch (error) {
        return {
            status: "ERR",
            message: "Lỗi khi lấy danh sách cửa hàng chưa duyệt: " + error.message
        };
    }
};

// Duyệt cửa hàng (chuyển trạng thái `isApproved` thành `true`)
const approveShop = async (shopId) => {
    try {
        const updatedShop = await Shop.findByIdAndUpdate(shopId, { isApproved: true }, { new: true });
        if (!updatedShop) {
            return { status: "ERR", message: "Không tìm thấy cửa hàng để duyệt" };
        }

        return {
            status: "success",
            message: "Cửa hàng đã được duyệt thành công",
            data: updatedShop
        };
    } catch (error) {
        return {
            status: "ERR",
            message: "Lỗi khi duyệt cửa hàng: " + error.message
        };
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
