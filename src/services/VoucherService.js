const Voucher = require("../models/VoucherModel");

const createVoucher = async (voucherData) => {
  try {
    const { code, discount } = voucherData;

    // Tạo voucher mới
    const newVoucher = new Voucher({ code, discount });

    // Lưu voucher vào cơ sở dữ liệu
    await newVoucher.save();

    return {
      status: "success",
      message: "Voucher đã được tạo thành công",
      data: newVoucher
    };
  } catch (error) {
    return {
      status: "ERR",
      message: "Đã có lỗi xảy ra khi tạo voucher: " + error.message
    };
  }
};

module.exports = {
  createVoucher,
};
