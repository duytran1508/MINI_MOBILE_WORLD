const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");
const {authMiddleWare,authUserMiddleWare} = require("../middleware/authMiddleware");

router.post("/sign-up", userController.createUser);
router.post("/sign-in", userController.loginUser);
router.put("/update-user/:id", userController.updateUser);
router.delete("/delete-user/:id", authMiddleWare, userController.deleteUser);
router.delete("/delete-many", userController.deleteManyUser);
router.get("/getAllUser", userController.getAllUser);
router.get(
  "/get-details/:id",
  authUserMiddleWare,
  userController.getDetailsUser
);
router.post("/refresh-token", userController.refreshToken);
router.post("/request-password-reset", userController.requestPasswordReset);
router.put("/change-password/:id", userController.changePassword);
module.exports = router;
