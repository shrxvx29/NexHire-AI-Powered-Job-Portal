import mongoose from "mongoose";
import Application from "../models/Application.js";
import Job, {} from "../models/Job.js";
const allowedStatuses = [
    "pending",
    "reviewing",
    "shortlisted",
    "rejected",
    "accepted",
];
// ==================================================
// 1. APPLY FOR A JOB
// POST /api/applications/apply
// ==================================================
export const applyJob = async (req, res) => {
    try {
        const { jobId, resume, coverLetter } = req.body;
        const userId = req.user._id;
        // Validate required fields
        if (!jobId) {
            res.status(400).json({
                success: false,
                message: "Job ID is required",
            });
            return;
        }
        if (typeof resume !== "string" || !resume.trim()) {
            res.status(400).json({
                success: false,
                message: "Resume URL is required",
            });
            return;
        }
        if (coverLetter !== undefined && typeof coverLetter !== "string") {
            res.status(400).json({
                success: false,
                message: "Invalid cover letter",
            });
            return;
        }
        if (req.user.role !== "seeker") {
            res.status(403).json({
                success: false,
                message: "Only job seekers can apply for jobs",
            });
            return;
        }
        // Check whether the job exists
        const job = await Job.findById(jobId);
        if (!job) {
            res.status(404).json({
                success: false,
                message: "Job not found",
            });
            return;
        }
        // Prevent recruiters from applying to their own jobs
        if (job.createdBy.toString() === userId.toString()) {
            res.status(400).json({
                success: false,
                message: "You cannot apply to your own job",
            });
            return;
        }
        // Prevent duplicate applications
        const existingApplication = await Application.findOne({
            job: jobId,
            applicant: userId,
        });
        if (existingApplication) {
            res.status(409).json({
                success: false,
                message: "You have already applied for this job",
            });
            return;
        }
        // Create application
        const application = await Application.create({
            job: jobId,
            applicant: userId,
            resume,
            coverLetter: coverLetter ?? "",
        });
        res.status(201).json({
            success: true,
            message: "Application submitted successfully",
            application,
        });
    }
    catch (error) {
        // Invalid MongoDB ID
        if (error instanceof mongoose.Error.CastError) {
            res.status(400).json({
                success: false,
                message: "Invalid job ID",
            });
            return;
        }
        // Duplicate application
        if (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000) {
            res.status(409).json({
                success: false,
                message: "You have already applied for this job",
            });
            return;
        }
        console.error("Apply job error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit application",
        });
    }
};
// ==================================================
// 2. GET MY APPLICATIONS
// GET /api/applications/my-applications
// ==================================================
export const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({
            applicant: req.user._id,
        })
            .populate("job", "title company location salary jobType")
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: applications.length,
            applications,
        });
    }
    catch (error) {
        console.error("Get my applications error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch your applications",
        });
    }
};
// ==================================================
// 3. GET APPLICATIONS FOR A RECRUITER'S JOB
// GET /api/applications/job/:jobId
// ==================================================
export const getJobApplications = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findById(jobId);
        if (!job) {
            res.status(404).json({
                success: false,
                message: "Job not found",
            });
            return;
        }
        // Only job owner can view applicants
        if (job.createdBy.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to view these applications",
            });
            return;
        }
        const applications = await Application.find({
            job: jobId,
        })
            .populate("applicant", "name email")
            .populate("job", "title company")
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: applications.length,
            applications,
        });
    }
    catch (error) {
        if (error instanceof mongoose.Error.CastError) {
            res.status(400).json({
                success: false,
                message: "Invalid job ID",
            });
            return;
        }
        console.error("Get job applications error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch job applications",
        });
    }
};
// ==================================================
// 4. UPDATE APPLICATION STATUS
// PATCH /api/applications/:applicationId/status
// ==================================================
export const updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;
        // Validate application status
        if (typeof status !== "string" ||
            !allowedStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                message: "Invalid application status",
            });
            return;
        }
        const application = await Application.findById(applicationId).populate("job", "createdBy title");
        if (!application) {
            res.status(404).json({
                success: false,
                message: "Application not found",
            });
            return;
        }
        // Verify populated job ownership
        const populatedJob = application.job;
        if (!populatedJob ||
            populatedJob.createdBy.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to update this application",
            });
            return;
        }
        application.status = status;
        await application.save();
        res.status(200).json({
            success: true,
            message: "Application status updated successfully",
            application,
        });
    }
    catch (error) {
        if (error instanceof mongoose.Error.CastError) {
            res.status(400).json({
                success: false,
                message: "Invalid application ID",
            });
            return;
        }
        console.error("Update application status error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update application status",
        });
    }
};
//# sourceMappingURL=applicationController.js.map