import express from "express";

import {
  createJob,
  getAllJobs,
  getMyJobs,
  updateJobs,
  deleteJob,
} from "../controllers/jobController.js";

import {
  protect,
  employerOnly,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: browse available jobs
router.get("/", getAllJobs);

// Employer: manage own jobs
router.get("/my-jobs", protect, employerOnly, getMyJobs);

router.post("/", protect, employerOnly, createJob);

router.patch<
  "/:id",
  { id: string },
  unknown,
  {
    title?: unknown;
    company?: unknown;
    location?: unknown;
    description?: unknown;
    salary?: unknown;
    jobType?: unknown;
    experienceLevel?: unknown;
    skills?: unknown;
  }
>("/:id", protect, employerOnly, updateJobs);

router.delete<"/:id", { id: string }>("/:id", protect, employerOnly, deleteJob);

export default router;