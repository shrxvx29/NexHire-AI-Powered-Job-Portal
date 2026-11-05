import express from "express";

import {
  uploadResume,
  uploadProfilePicture,
  uploadCompanyLogo,
} from "../controllers/uploadController.js";

import {
  protect,
  employerOnly,
} from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";
import imageUpload from "../middleware/imageUploadMiddleware.js";

const router = express.Router();

// Resume upload (PDF, max 5 MB)
router.post(
  "/resume",
  protect,
  upload.single("resume"),
  uploadResume
);

// Profile picture upload (JPG, PNG, WEBP, max 2 MB)
router.post(
  "/profile-picture",
  protect,
  imageUpload.single("profilePicture"),
  uploadProfilePicture
);

// Company logo upload (employers only)
router.post(
  "/company-logo",
  protect,
  employerOnly,
  imageUpload.single("companyLogo"),
  uploadCompanyLogo
);

export default router;