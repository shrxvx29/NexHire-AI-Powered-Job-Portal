import express from "express";
import { applyJob, getMyApplications, getJobApplications, updateApplicationStatus, } from "../controllers/applicationController.js";
import { protect, employerOnly, } from "../middleware/authMiddleware.js";
const router = express.Router();
// Job seeker
router.post("/", protect, applyJob);
router.get("/my-applications", protect, getMyApplications);
// Employer
router.get("/job/:jobId", protect, employerOnly, getJobApplications);
router.patch("/:applicationId/status", protect, employerOnly, updateApplicationStatus);
export default router;
//# sourceMappingURL=applicationRoutes.js.map