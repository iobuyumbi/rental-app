const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { protect, admin, adminOrAssistant } = require("../middleware/auth");

const router = express.Router();
const { authRateLimiter } = require("../middleware/rateLimiter");

// Public routes
router.post("/login", authRateLimiter, loginUser);

// Protected routes
router.use(protect);

router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);

// Admin only routes
router.post("/register", authRateLimiter, admin, registerUser);
router.get("/", admin, getUsers);
router.put("/:id", admin, updateUser);
router.delete("/:id", admin, deleteUser);

module.exports = router;
