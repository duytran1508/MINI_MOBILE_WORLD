const UserRouter = require("./UserRouter");
const ProductRouter = require("./ProductRouter");
const OrderRouter = require("./OrderRouter");
const CartRouter = require("./CartRouter");
const OtpRouter = require("./otpRoutes");
const GoogleRouter = require("./GoogleRouter");
const ReviewRouter = require("./ReviewRouter");
const PaymentRouter = require("./PaymentRouter");
const CategoryRouter = require("./CategoryRouter");
const AdminRouter = require("./AdminRoutes");
const VoucherRouter = require("./VoucherRouter");
const AddressRouter = require("./AddressRouter");

const routes = (app) => {
  app.use("/api/user", UserRouter);
  app.use("/api/product", ProductRouter);
  app.use("/api/order", OrderRouter);
  app.use("/api/cart", CartRouter);
  app.use("/api/otp", OtpRouter);
  app.use("/", GoogleRouter);
  app.use("/api/review", ReviewRouter);
  app.use("/api/payments", PaymentRouter);
  app.use("/api/category", CategoryRouter);
  app.use("/api/check", AdminRouter);
  app.use("/api/voucher", VoucherRouter);
  app.use("/api/address", AddressRouter);
};
module.exports = routes;
