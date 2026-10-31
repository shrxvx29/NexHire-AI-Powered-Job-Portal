
import type { Request, Response } from "express";
import mongoose, { type QueryFilter } from "mongoose";

import Job, { type IJob } from "../models/Job.js";
import sendEmail from "../config/email.js";
import { newJobPosted } from "../utils/emailTemplates.js";

// --------------------------------------------------
// Types & Interfaces
// --------------------------------------------------

interface CreateJobBody {
    title?: unknown;
    company?: unknown;
    location?: unknown;
    description?: unknown;
    salary?: unknown;
    jobType?: unknown;
    experienceLevel?: unknown;
    skills?: unknown;
}

interface UpdateJobBody {
    title?: unknown;
    company?: unknown;
    location?: unknown;
    description?: unknown;
    salary?: unknown;
    jobType?: unknown;
    experienceLevel?: unknown;
    skills?: unknown;
}

interface JobParams {
    id: string;
}

type JobUpdateField =
    | "title"
    | "company"
    | "location"
    | "description"
    | "salary"
    | "jobType"
    | "experienceLevel"
    | "skills";

interface JobUpdateFields {
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    salary?: string | number;
    jobType?: string;
    experienceLevel?: string;
    skills?: string[];
}

// --------------------------------------------------
// Helper Functions
// --------------------------------------------------

const getErrorMessage = (error: unknown): string => {
    return error instanceof Error
        ? error.message
        : "Unknown error occurred";
};

const isCastError = (error: unknown): boolean => {
    return error instanceof mongoose.Error.CastError;
};

const escapeRegex = (value: string): string => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ==================================================
// 1. CREATE JOB
// POST /api/jobs
// ==================================================

export const createJob = async (
    req: Request<Record<string, never>, unknown, CreateJobBody>,
    res: Response
): Promise<void> => {
    try {
        const {
            title,
            company,
            location,
            description,
            salary,
            jobType,
            experienceLevel,
            skills,
        } = req.body;

        // Validate required fields

        if (
            typeof title !== "string" ||
            typeof company !== "string" ||
            typeof location !== "string" ||
            typeof description !== "string" ||
            !title.trim() ||
            !company.trim() ||
            !location.trim() ||
            !description.trim()
        ) {
            res.status(400).json({
                success: false,
                message: "Title, company, location, and description are required",
            });
            return;
        }

        // Validate optional fields

        if (
            salary !== undefined &&
            typeof salary !== "string" &&
            typeof salary !== "number"
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid salary value",
            });
            return;
        }

        if (
            jobType !== undefined &&
            typeof jobType !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid job type",
            });
            return;
        }

        if (
            experienceLevel !== undefined &&
            typeof experienceLevel !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid experience level",
            });
            return;
        }

        if (
            skills !== undefined &&
            (!Array.isArray(skills) ||
                !skills.every((skill) => typeof skill === "string"))
        ) {
            res.status(400).json({
                success: false,
                message: "Skills must be an array of strings",
            });
            return;
        }

        // Create job

        const job = await Job.create({
            title: title.trim(),
            company: company.trim(),
            location: location.trim(),
            description: description.trim(),
            ...(salary !== undefined ? { salary: String(salary) } : {}),
            ...(jobType !== undefined
                ? { jobType: jobType as IJob["jobType"] }
                : {}),
            ...(experienceLevel !== undefined
                ? {
                      experienceLevel:
                          experienceLevel as IJob["experienceLevel"],
                  }
                : {}),
            skills: skills ?? [],
            createdBy: req.user._id,
        });

        // Send notification email without failing job creation

        if (req.user.email) {
            try {
                const { subject, html } = newJobPosted(job.title);

                await sendEmail({
                    to: req.user.email,
                    subject,
                    html,
                });

            } catch (emailError: unknown) {
                console.error(
                    "Job notification email failed:",
                    getErrorMessage(emailError)
                );
            }
        }

        res.status(201).json({
            success: true,
            message: "Job created successfully",
            job,
        });

    } catch (error: unknown) {

        console.error("Create job error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create job",
        });
    }
};

// ==================================================
// 2. GET ALL JOBS
// GET /api/jobs
// ==================================================

export const getAllJobs = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            search,
            location,
            jobType,
            experienceLevel,
            page = "1",
            limit = "10",
        } = req.query;

        // Convert pagination values

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        // Validate pagination

        if (
            !Number.isInteger(pageNumber) ||
            !Number.isInteger(pageSize) ||
            pageNumber < 1 ||
            pageSize < 1 ||
            pageSize > 100
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid pagination parameters",
            });
            return;
        }

        // Build safe MongoDB filters

        const filter: QueryFilter<IJob> = {};

        if (typeof search === "string") {
            const escapedSearch = escapeRegex(search.trim());

            if (escapedSearch) {
                const searchRegex = new RegExp(
                    escapedSearch,
                    "i"
                );

                filter.$or = [
                    { title: searchRegex },
                    { company: searchRegex },
                    { description: searchRegex },
                ];
            }
        }

        if (typeof location === "string" && location.trim()) {
            filter.location = new RegExp(
                escapeRegex(location.trim()),
                "i"
            );
        }

        if (typeof jobType === "string" && jobType.trim()) {
            filter.jobType = jobType as IJob["jobType"];
        }

        if (
            typeof experienceLevel === "string" &&
            experienceLevel.trim()
        ) {
            filter.experienceLevel =
                experienceLevel as IJob["experienceLevel"];
        }

        // Fetch jobs and total count

        const [jobs, totalJobs] = await Promise.all([
            Job.find(filter)
                .populate("createdBy", "name")
                .sort({ createdAt: -1 })
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
                .lean(),

            Job.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            totalJobs,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalJobs / pageSize),
            jobs,
        });

    } catch (error: unknown) {

        console.error("Get all jobs error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch jobs",
        });
    }
};

// ==================================================
// 3. GET MY JOBS
// GET /api/jobs/my-jobs
// ==================================================

export const getMyJobs = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const jobs = await Job.find({
            createdBy: req.user._id,
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs,
        });

    } catch (error: unknown) {

        console.error("Get my jobs error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch your jobs",
        });
    }
};

// ==================================================
// 4. UPDATE JOB
// PUT /api/jobs/:id
// ==================================================

export const updateJobs = async (
    req: Request<JobParams, unknown, UpdateJobBody>,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        // Allowed update fields

        const allowedFields: JobUpdateField[] = [
            "title",
            "company",
            "location",
            "description",
            "salary",
            "jobType",
            "experienceLevel",
            "skills",
        ];

        const updates: JobUpdateFields = {};

        // Extract only supported fields

        for (const field of allowedFields) {
            const value = req.body[field];

            if (value !== undefined) {
                switch (field) {
                    case "title":
                    case "company":
                    case "location":
                    case "description":
                    case "jobType":
                    case "experienceLevel": {
                        if (
                            typeof value !== "string" ||
                            !value.trim()
                        ) {
                            res.status(400).json({
                                success: false,
                                message: `${field} must be a non-empty string`,
                            });
                            return;
                        }

                        updates[field] = value.trim();
                        break;
                    }

                    case "salary": {
                        if (
                            typeof value !== "string" &&
                            typeof value !== "number"
                        ) {
                            res.status(400).json({
                                success: false,
                                message: "Invalid salary value",
                            });
                            return;
                        }

                        updates.salary = value;
                        break;
                    }

                    case "skills": {
                        if (
                            !Array.isArray(value) ||
                            !value.every(
                                (skill) => typeof skill === "string"
                            )
                        ) {
                            res.status(400).json({
                                success: false,
                                message: "Skills must be an array of strings",
                            });
                            return;
                        }

                        updates.skills = value;
                        break;
                    }
                }
            }
        }

        // Check for empty updates

        if (Object.keys(updates).length === 0) {
            res.status(400).json({
                success: false,
                message: "No valid fields provided for update",
            });
            return;
        }

        // Check job ID and ownership

        const job = await Job.findOneAndUpdate(
            {
                _id: id,
                createdBy: req.user._id,
            },
            {
                $set: updates,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!job) {
            res.status(404).json({
                success: false,
                message: "Job not found or you are not authorized to update it",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Job updated successfully",
            job,
        });

    } catch (error: unknown) {

        if (isCastError(error)) {
            res.status(400).json({
                success: false,
                message: "Invalid job ID",
            });
            return;
        }

        console.error("Update job error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update job",
        });
    }
};

// ==================================================
// 5. DELETE JOB
// DELETE /api/jobs/:id
// ==================================================

export const deleteJob = async (
    req: Request<JobParams>,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        // Only job owner can delete the job

        const job = await Job.findOneAndDelete({
            _id: id,
            createdBy: req.user._id,
        });

        if (!job) {
            res.status(404).json({
                success: false,
                message: "Job not found or you are not authorized to delete it",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Job deleted successfully",
            jobId: job._id,
        });

    } catch (error: unknown) {

        if (isCastError(error)) {
            res.status(400).json({
                success: false,
                message: "Invalid job ID",
            });
            return;
        }

        console.error("Delete job error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete job",
        });
    }
};
