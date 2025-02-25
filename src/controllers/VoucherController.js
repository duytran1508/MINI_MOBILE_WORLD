const VoucherService = require("../services/VoucherService");
const Voucher = require("../models/VoucherModel");

const createVoucher = async (req, res) => {
  try {
    const { code, discount } = req.body;

    if (!code || !discount) {
      return res.status(400).json({
        status: "ERR",
        message: "Mã voucher và phần trăm giảm giá là bắt buộc"
      });
    }

    const existingVoucher = await Voucher.findOne({ code });
    if (existingVoucher) {
      return res.status(400).json({
        status: "ERR",
        message: "Voucher đã tồn tại với mã này"
      });
    }

    const response = await VoucherService.createVoucher(req.body);

    if (response.status === "ERR") {
      return res.status(400).json(response);
    }

    return res.status(201).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERR",
      message: "Đã có lỗi xảy ra khi tạo voucher: " + e.message
    });
  }
};

const checkVoucher = async (req, res) => {
  const { code } = req.body;

  try {
    const voucher = await Voucher.findOne({ code });

    if (!voucher) {
      return res.status(404).json({ message: "Mã giảm giá không hợp lệ" });
    }

    return res.json({ discount: voucher.discount });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

const listVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find();

    if (vouchers.length === 0) {
      return res.status(404).json({ message: "No vouchers found" });
    }

    return res.status(200).json({ data: vouchers });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createVoucher,
  checkVoucher,
  listVouchers
};
