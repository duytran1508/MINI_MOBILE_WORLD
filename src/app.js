const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const routes = require("./routes");

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

routes(app);

mongoose
  .connect(process.env.MONGO_DB, {
  })
  .then(() => {
    console.log("Connect DB success");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// Server
app.listen(port, () => {
  console.log("Server is running on port", port);
});
