import express from "express";
import { careerChat, analyseResume, jobMatchScore, generateCoverLetter, } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/career-chat", protect, careerChat);
router.post("/analyse-resume", protect, analyseResume);
router.post("/job-match-score", protect, jobMatchScore);
router.post("/generate-cover-letter", protect, generateCoverLetter);
export default router;
//# sourceMappingURL=aiRoutes.js.map