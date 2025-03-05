const UserService = require("../services/UserService");
const JwtService = require("../services/JwtService");
const OTPService = require("../services/OtpService");
const User = require("../models/UserModel");
const TempUser = require("../models/tempUserModel");
const bcrypt = require("bcrypt");

const createUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    if (!name || !email || !password || !confirmPassword || !phone) {
      return res.status(400).json({
        status: "ERR",
        message: "All input fields are required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: "ERR",
        message: "Password and confirm password do not match"
      });
    }

    const response = await UserService.createUser(req.body);

    if (response.status === "ERR") {
      return res.status(400).json(response);
    }

    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERR",
      message: "An error occurred while registering the user: " + e.message
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: "ERR",
        message: "The input is required"
      });
    }
    const response = await UserService.loginUser(req.body);

    if (response.status === "ERR") {
      return res.status(400).json({
        status: "ERR",
        message: response.message
      });
    }

    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message || "An error"
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const data = req.body;
    
    if (!userId) {
      return res.status(200).json({
        status: "ERR",
        message: "the userId is required "
      });
    }
    const response = await UserService.updateUser(userId, data);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e
    });
  }
};
const updateRoles = async (req, res) => {
  try {
    const userId = req.params.id;
    const { roles } = req.headers;
    if (!userId) {
      return res.status(400).json({
        status: "ERR",
        message: "User ID is required"
      });
    }

    if (!roles) {
      return res.status(400).json({
        status: "ERR",
        message: "Roles field is required"
      
      });
    }

    const response = await UserService.updateRoles(userId, roles);

    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERR",
      message: "An error occurred while updating roles",
      error: e.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({
        status: "ERR",
        message: "The userId is required"
      });
    }

    const response = await UserService.deleteUser(userId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      message: "Server error",
      error: e.message
    });
  }
};

const deleteManyUser = async (req, res) => {
  try {
    const ids = req.body;
    if (!ids) {
      return res.status(200).json({
        status: "ERR",
        message: "the ids is required "
      });
    }
    const response = await UserService.deleteManyUser(ids);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e
    });
  }
};

const getAllUser = async (req, res) => {
  try {
    const response = await UserService.getAllUser();
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e
    });
  }
};

const getDetailsUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(200).json({
        status: "ERR",
        message: "the userId is required "
      });
    }
    const response = await UserService.getDetailsUser(userId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.headers.token.split(" ")[1];
    if (!token) {
      return res.status(200).json({
        status: "ERR",
        message: "the token is required "
      });
    }
    const response = await JwtService.refreshTokenJwtService(token);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e
    });
  }
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại" });
    }

    const otpToken = await OTPService.sendResetPasswordOTP(email);

    const hashedPassword = bcrypt.hashSync(otpToken, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: "Mật khẩu tạm thời đã được gửi đến email của bạn."
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi đặt lại mật khẩu." });
  }
};
const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.params.id;

  try {
    if (!userId || !currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        status: "ERR",
        message: "All fields are required"
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        status: "ERR",
        message: "New password and confirm password do not match"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "ERR",
        message: "User not found"
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordMatch) {
      return res.status(400).json({
        status: "ERR",
        message: "Current password is incorrect"
      });
    }

    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({
      status: "OK",
      message: "Password updated successfully"
    });
  } catch (e) {
    return res.status(500).json({
      status: "ERR",
      message: "An error occurred while changing the password: " + e.message
    });
  }
};

const requestUpgrade = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: "ERR",
        message: "User ID không được để trống",
      });
    }

    const response = await UserService.requestSellerUpgrade(userId);
    return res.status(response.status === "OK" ? 200 : 400).json(response);
  } catch (error) {
    return res.status(500).json({
      status: "ERR",
      message: "Lỗi máy chủ: " + error.message,
    });
  }
};

const getPendingSellers = async (req, res) => {
  try {
    const response = await UserService.getPendingSellerRequests();
    return res.status(response.status === "OK" ? 200 : 400).json(response);
  } catch (error) {
    return res.status(500).json({
      status: "ERR",
      message: "Lỗi máy chủ: " + error.message,
    });
  }
};

const upgradeToSeller = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: "ERR",
        message: "User ID không được để trống",
      });
    }

    const response = await UserService.upgradeUserRole(userId);
    return res.status(response.status === "OK" ? 200 : 400).json(response);
  } catch (error) {
    return res.status(500).json({
      status: "ERR",
      message: "Lỗi máy chủ: " + error.message,
    });
  }
};


module.exports = {
  createUser,
  loginUser,
  changePassword,
  updateUser,
  updateRoles,
  deleteUser,
  deleteManyUser,
  getAllUser,
  getDetailsUser,
  refreshToken,
  requestPasswordReset,
  requestUpgrade,
  getPendingSellers,
  upgradeToSeller,
};
