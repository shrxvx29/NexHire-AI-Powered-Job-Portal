
import express from "express";

import {
  register,
  login,
  getMe,
  updateProfile,
} from "../controllers/authController.js";

import {
  getEmployerProfile,
  updateEmployerProfile,
} from "../controllers/employerProfileController.js";

import { protect, employerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Authenticated routes
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);

// Employer-only profile routes
router.get(
  "/employer-profile",
  protect,
  employerOnly,
  getEmployerProfile
);

router.patch(
  "/employer-profile",
  protect,
  employerOnly,
  updateEmployerProfile
);

export default router;
