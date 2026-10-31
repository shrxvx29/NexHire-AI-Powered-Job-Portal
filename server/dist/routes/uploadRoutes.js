import express from "express";
import { uploadResume, uploadProfilePicture, } from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import imageUpload from "../middleware/imageUploadMiddleware.js";
const router = express.Router();
// Resume upload (PDF, max 5 MB)
router.post("/resume", protect, upload.single("resume"), uploadResume);
// Profile picture upload (JPG, PNG, WEBP, max 2 MB)
router.post("/profile-picture", protect, imageUpload.single("profilePicture"), uploadProfilePicture);
export default router;
//# sourceMappingURL=uploadRoutes.js.map