const express = require("express");
const router = express.Router();
const {authAdminMiddleware,authUserMiddleWare} = require("../middleware/authMiddleware");

router.get("/admin", authAdminMiddleware, (req, res) => {
  res.send("Welcome to Admin Dashboard");
});
router.get("/user", authUserMiddleWare, (req, res) => {
  res.send("Welcome to User Dashboard");
});

module.exports = router;
