import express from "express";

import {
  applyJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
} from "../controllers/applicationController.js";

import {
  protect,
  employerOnly,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Job seeker
router.post("/", protect, applyJob);

router.get("/my-applications", protect, getMyApplications);

// Employer
router.get<"/job/:jobId", { jobId: string }>(
  "/job/:jobId",
  protect,
  employerOnly,
  getJobApplications
);

router.patch<
  "/:applicationId/status",
  { applicationId: string },
  unknown,
  { status?: string }
>(
  "/:applicationId/status",
  protect,
  employerOnly,
  updateApplicationStatus
);

export default router;