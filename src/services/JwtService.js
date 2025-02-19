const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { status } = require("express/lib/response");
dotenv.config();

const genneralAccessToken = async (payload) => {
  const access_token = jwt.sign(
    {
      payload
    },
    process.env.ACCESS_TOKEN,
    { expiresIn: "1d" }
  );

  return access_token;
};

const genneralRefreshToken = async (payload) => {
  const refresh_token = jwt.sign(
    {
      payload
    },
    process.env.REFRESH_TOKEN,
    { expiresIn: "365d" }
  );

  return refresh_token;
};

const refreshTokenJwtService = (token) => {
  return new Promise((resolve, reject) => {
    try {
      jwt.verify(token, process.env.REFRESH_TOKEN, async (err, decoded) => {
        if (err) {
          return resolve({
            status: "ERROR",
            message: "Authentication failed!",
          });
        }

        const { id, roles } = decoded.payload; // Lấy thông tin từ payload

        const access_token = await genneralAccessToken({ id, roles }); // Cấp lại access token mới

        resolve({
          status: "OK",
          message: "Success",
          access_token,
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};


module.exports = {
  genneralAccessToken,
  genneralRefreshToken,
  refreshTokenJwtService
};
