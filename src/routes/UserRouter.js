const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");
const { authAdminMiddleware} = require("../middleware/authMiddleware");

router.post("/sign-up", userController.createUser);
router.post("/sign-in", userController.loginUser);
router.put("/update-user/:id",userController.updateUser);
router.put("/update-roles/:id" ,userController.updateRoles);
router.delete("/delete-user/:id", userController.deleteUser);
router.delete("/delete-many", userController.deleteManyUser);
router.get("/getAllUser",authAdminMiddleware ,userController.getAllUser);
router.get("/get-details/:id",userController.getDetailsUser);
router.post("/refresh-token", userController.refreshToken);
router.post("/request-password-reset", userController.requestPasswordReset);
router.put("/change-password/:id", userController.changePassword);
router.get("/get-pending-sellers", userController.getPendingSellers);
router.put("/upgrade-role", userController.upgradeToSeller);
router.post("/request-upgrade", userController.uploadProductImages, userController.requestUpgrade);
router.post("/follow", userController.followUser);
router.post("/unfollow", userController.unfollowUser);
router.get("/followers-following/:userId", userController.getFollowersAndFollowing);
router.get("/follower-count/:userId", userController.getFollowerCount);


module.exports = router;
