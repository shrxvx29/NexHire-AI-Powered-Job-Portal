import express from "express";
import { register, login, getMe, updateProfile, } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
// Public routes
router.post("/register", register);
router.post("/login", login);
// Protected routes
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);
export default router;
//# sourceMappingURL=authRoutes.js.map