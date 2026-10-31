import express from "express";
import { createJob, getAllJobs, getMyJobs, updateJobs, deleteJob, } from "../controllers/jobController.js";
import { protect, employerOnly, } from "../middleware/authMiddleware.js";
const router = express.Router();
// Public: browse available jobs
router.get("/", getAllJobs);
// Employer: manage own jobs
router.get("/my-jobs", protect, employerOnly, getMyJobs);
router.post("/", protect, employerOnly, createJob);
router.patch("/:id", protect, employerOnly, updateJobs);
router.delete("/:id", protect, employerOnly, deleteJob);
export default router;
//# sourceMappingURL=jobRoutes.js.map