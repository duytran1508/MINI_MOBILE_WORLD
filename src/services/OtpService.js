const speakeasy = require("speakeasy");
const nodemailer = require("nodemailer");
require("dotenv").config();
const { mail } = require("../mail/mailForm");
const crypto = require("crypto");
class OTPService {
  constructor() {
    this.secret = this.getSecret();
  }

  getSecret() {
    const secret = process.env.SECRET_OTP_TOKEN || "";

    if (!secret) {
      throw new Error("SECRET_OTP_TOKEN environment variable is not defined.");
    }

    return secret;
  }

  generateOTPcode() {
    return speakeasy.totp({
      secret: this.secret,
      encoding: "base32",
      digits: 6,
      step: 60
    });
  }

  async sendMailWithOTP(email) {
    const token = this.generateOTPcode();
    const subject = "Mã xác minh";
    const mailForm = mail(token, subject);
    const mailOptions = {
      from: "Nhóm 10",
      to: email,
      subject,
      html: mailForm
    };

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      const info = await transporter.sendMail(mailOptions);
      return token;
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email.", error);
    }
  }

  async sendResetPasswordOTP(email) {
    const token = this.generateRandomToken(60, 100);

    const otpToken = token.slice(0, 16);

    const subject = "HD TECH gửi đến bạn mật khẩu mới";
    const mailForm = mail(otpToken, subject);

    const mailOptions = {
      from: "Nhóm 10",
      to: email,
      subject,
      html: mailForm
    };

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      const info = await transporter.sendMail(mailOptions);

      return otpToken;
    } catch (error) {
      console.error("Error sending reset password email:", error);
      throw new Error("Failed to send reset password email.", error);
    }
  }

  generateRandomToken(minLength, maxLength) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const tokenLength =
      Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let token = "";

    for (let i = 0; i < tokenLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      token += characters[randomIndex];
    }

    return token;
  }
}

module.exports = new OTPService();
