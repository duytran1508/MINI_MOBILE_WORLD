const otpService = require("../services/OtpService");
const TempUser = require("../models/tempUserModel");
const User = require("../models/UserModel");

const sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    await otpService.sendMailWithOTP(email);
    res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otpToken } = req.body;
  try {
    const tempUser = await TempUser.findOne({ email });

    if (!tempUser) {
      return res.status(400).json({ message: "Invalid OTP or email" });
    }
    if (tempUser.otpToken !== otpToken) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const newUser = new User({
      name: tempUser.name,
      email: tempUser.email,
      password: tempUser.password,
      confirmPassword: tempUser.password,
      phone: tempUser.phone,
      roles: tempUser.roles
    });

    const savedUser = await newUser.save();
    await TempUser.findByIdAndDelete(tempUser._id);
    res
      .status(201)
      .json({ message: "User registered successfully", user: savedUser });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error verifying OTP", error: err.message });
  }
};
module.exports = {
  verifyOTP,
  sendOTP
};
