const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const OTPService = require("./OtpService");

const TempUser = require("../models/tempUserModel");
const { genneralAccessToken, genneralRefreshToken } = require("./JwtService");

const createUser = (newUser) => {
  return new Promise(async (resolve, reject) => {
    const { name, email, password, phone } = newUser;

    try {
      const existingUser = await User.findOne({ email });
      const existingTempUser = await TempUser.findOne({ email });

      if (existingUser || existingTempUser) {
        return resolve({
          status: "ERR",
          message: "The email is already in use"
        });
      }

      const hash = bcrypt.hashSync(password, 10);

      const otpToken = await OTPService.sendMailWithOTP(email);

      const savedTempUser = await TempUser.create({
        name,
        email,
        password: hash,
        phone,
        roles: 2,
        otpToken
      });

      resolve({
        status: "OK",
        message: "OTP has been sent to your email. Please verify.",
        tempUser: savedTempUser
      });
    } catch (e) {
      reject({
        status: "ERR",
        message: "Error occurred during user registration: " + e.message
      });
    }
  });
};

const loginUser = (userLogin) => {
  return new Promise(async (resolve, reject) => {
    const { email, password } = userLogin;
    try {
      const checkUser = await User.findOne({
        email: email
      });

      if (!checkUser) {
        resolve({
          status: "ERR",
          message: "User is not defined"
        });
        return;
      }

      const comparePassword = await bcrypt.compare(
        password,
        checkUser.password
      );

      if (!comparePassword) {
        resolve({
          status: "ERR",
          message: "User or password incorrect"
        });
        return;
      }

      const { _id: id, name, phone, roles, shopId } = checkUser;

      const access_token = await genneralAccessToken({ id, roles });
      const refresh_token = await genneralRefreshToken({ id, roles });

      resolve({
        status: "OK",
        message: "Success",
        dataUser: { id, name, email, roles, phone,shopId },
        access_token,
        refresh_token,
      });
    } catch (error) {
      reject(error);
    }
  });
};

const updateUser = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({ _id: id });

      if (!checkUser) {
        return resolve({
          status: "Error",
          message: "User not found"
        });
      }
      const updatedUser = await User.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
      });
      if (!updatedUser) {
        return resolve({
          status: "Error",
          message: "Update failed"
        });
      }
      return resolve({
        status: "Success",
        message: "User updated successfully",
        data: updatedUser
      });
    } catch (e) {
      reject({
        status: "Error",
        message: "An error occurred while updating the user",
        error: e
      });
    }
  });
};
const updateRoles = (id, roles) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({ _id: id });

      if (!checkUser) {
        return resolve({
          status: "ERR",
          message: "User not found"
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { roles },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return resolve({
          status: "ERR",
          message: "Failed to update roles"
        });
      }

      return resolve({
        status: "OK",
        message: "Roles updated successfully",
        data: updatedUser
      });
    } catch (e) {
      reject({
        status: "ERR",
        message: "An error occurred while updating roles",
        error: e.message
      });
    }
  });
};

const deleteUser = async (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({ _id: id });
      if (checkUser === null) {
        return reject({
          status: 404,
          message: "User is not defined"
        });
      }

      await User.findByIdAndDelete(id);
      resolve({
        status: "OK",
        message: "Delete success"
      });
    } catch (e) {
      reject(e);
    }
  });
};

const deleteManyUser = (ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      await User.deleteMany({ _id: ids });
      resolve({
        status: "Oke",
        massage: "delete success"
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getAllUser = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const allUser = await User.find();
      resolve({
        status: "Oke",
        massage: "success",
        data: allUser
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getDetailsUser = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({
        _id: id
      }).select("-roles");
      if (user === null) {
        resolve({
          status: "Oke",
          message: "User is not defined"
        });
      }

      resolve({
        status: "Oke",
        massage: "success",
        data: user
      });
    } catch (e) {
      reject(e);
    }
  });
};

const requestSellerUpgrade = ({ userId, verificationDocs, businessPlan, upgradeReason }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findById(userId);

      if (!user) {
        return resolve({ status: "ERR", message: "Người dùng không tồn tại" });
      }

      if (user.requestUpgrade) {
        return resolve({ status: "ERR", message: "Bạn đã gửi yêu cầu trước đó" });
      }

      // Cập nhật thông tin yêu cầu nâng cấp
      user.requestUpgrade = true;
      user.upgradeReason = upgradeReason;
      user.verificationDocs = verificationDocs; // Lưu danh sách URL ảnh
      user.businessPlan = businessPlan;

      await user.save();

      resolve({
        status: "OK",
        message: "Yêu cầu nâng cấp đã được gửi thành công",
        data: {
          userId: user._id,
          upgradeReason: user.upgradeReason,
          verificationDocs: user.verificationDocs,
          businessPlan: user.businessPlan,
        },
      });
    } catch (error) {
      reject({ status: "ERR", message: "Lỗi: " + error.message });
    }
  });
};

const getPendingSellerRequests = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const pendingSellers = await User.find({ roles: 2, requestUpgrade: true }).select("name email id phone upgradeReason verificationDocs businessPlan");

      resolve({
        status: "OK",
        message: "Danh sách người dùng yêu cầu nâng cấp",
        users: pendingSellers,
      });
    } catch (error) {
      reject({ status: "ERR", message: "Lỗi: " + error.message });
    }
  });
};

const upgradeUserRole = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findById(userId);

      if (!user) {
        return resolve({ status: "ERR", message: "Người dùng không tồn tại" });
      }

      if (user.roles !== 2 || !user.requestUpgrade) {
        return resolve({ status: "ERR", message: "Người dùng không hợp lệ để nâng cấp" });
      }

      user.roles = 1; // Chuyển thành người bán
      user.requestUpgrade = false; // Hủy trạng thái yêu cầu sau khi duyệt
      await user.save();

      resolve({
        status: "OK",
        message: "Nâng cấp tài khoản thành công",
        user,
      });
    } catch (error) {
      reject({ status: "ERR", message: "Lỗi: " + error.message });
    }
  });
};

// Người dùng theo dõi người khác
const followUser = async (userId, targetUserId) => {
  if (userId === targetUserId) throw new Error("Bạn không thể tự theo dõi chính mình");

  const user = await User.findById(userId);
  const targetUser = await User.findById(targetUserId);

  if (!user || !targetUser) throw new Error("Người dùng không tồn tại");

  if (targetUser.followers && targetUser.followers.includes(userId)) {
    throw new Error("Bạn đã theo dõi người này rồi");
  }

  // Cập nhật danh sách follower và following
  await User.findByIdAndUpdate(userId, { $push: { following: targetUserId } });
  await User.findByIdAndUpdate(targetUserId, { $push: { followers: userId } });

  return { message: "Theo dõi thành công" };
};

// Người dùng hủy theo dõi người khác
const unfollowUser = async (userId, targetUserId) => {
  if (userId === targetUserId) throw new Error("Bạn không thể tự bỏ theo dõi chính mình");

  const user = await User.findById(userId);
  const targetUser = await User.findById(targetUserId);

  if (!user || !targetUser) throw new Error("Người dùng không tồn tại");

  if (!targetUser.followers || !targetUser.followers.includes(userId)) {
    throw new Error("Bạn chưa theo dõi người này");
  }

  // Cập nhật danh sách follower và following
  await User.findByIdAndUpdate(userId, { $pull: { following: targetUserId } });
  await User.findByIdAndUpdate(targetUserId, { $pull: { followers: userId } });

  return { message: "Bỏ theo dõi thành công" };
};

// Lấy danh sách người theo dõi và đang theo dõi
const getFollowersAndFollowing = async (userId) => {
  const user = await User.findById(userId).select("followers following");
  if (!user) throw new Error("Người dùng không tồn tại");

  return { followers: user.followers, following: user.following };
};

// Lấy số lượng người theo dõi
const getFollowerCount = async (userId) => {
  const user = await User.findById(userId).select("followers");
  if (!user) throw new Error("Người dùng không tồn tại");

  return { followerCount: user.followers.length };
};

module.exports = {
  createUser,
  loginUser,
  updateUser,
  updateRoles,
  deleteUser,
  deleteManyUser,
  getAllUser,
  getDetailsUser,
  requestSellerUpgrade,
  getPendingSellerRequests,
  upgradeUserRole,
  followUser,
  unfollowUser,
  getFollowersAndFollowing,
  getFollowerCount,
};
