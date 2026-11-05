
import type { Request, Response } from "express";
import User from "../models/User.js";

interface EmployerProfileBody {
  companyName?: unknown;
  website?: unknown;
  industry?: unknown;
  location?: unknown;
  companySize?: unknown;
  description?: unknown;
  recruiterPhone?: unknown;
  linkedinUrl?: unknown;
}

const allowedCompanySizes = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// GET /api/auth/employer-profile
export const getEmployerProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Employer account not found.",
      });
      return;
    }

    if (user.role !== "employer") {
      res.status(403).json({
        success: false,
        message: "Employer access only.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      profile: {
        name: user.name,
        email: user.email,
        ...(user.companyProfile ?? {}),      },
    });
  } catch (error: unknown) {
    console.error("Get employer profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch employer profile.",
    });
  }
};

// PATCH /api/auth/employer-profile
export const updateEmployerProfile = async (
  req: Request<Record<string, never>, unknown, EmployerProfileBody>,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Employer account not found.",
      });
      return;
    }

    if (user.role !== "employer") {
      res.status(403).json({
        success: false,
        message: "Employer access only.",
      });
      return;
    }

    const body = req.body;
    const updates: Record<string, string> = {};

    const stringFields = [
      "companyName",
      "website",
      "industry",
      "location",
      "companySize",
      "description",
      "recruiterPhone",
      "linkedinUrl",
    ] as const;

    for (const field of stringFields) {
      const value = body[field];

      if (value === undefined) continue;

      if (typeof value !== "string") {
        res.status(400).json({
          success: false,
          message: `${field} must be a string.`,
        });
        return;
      }

      updates[`companyProfile.${field}`] = value.trim();
    }

    if (
      updates["companyProfile.companyName"] !== undefined &&
      updates["companyProfile.companyName"].length > 120
    ) {
      res.status(400).json({
        success: false,
        message: "Company name cannot exceed 120 characters.",
      });
      return;
    }

    if (
      updates["companyProfile.description"] !== undefined &&
      updates["companyProfile.description"].length > 2000
    ) {
      res.status(400).json({
        success: false,
        message: "Company description cannot exceed 2000 characters.",
      });
      return;
    }

    const website = updates["companyProfile.website"];
    const linkedinUrl = updates["companyProfile.linkedinUrl"];

    if (website && !isValidUrl(website)) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid website URL including https://.",
      });
      return;
    }

    if (linkedinUrl && !isValidUrl(linkedinUrl)) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid LinkedIn URL including https://.",
      });
      return;
    }

    const companySize = updates["companyProfile.companySize"];

    if (companySize && !allowedCompanySizes.includes(companySize)) {
      res.status(400).json({
        success: false,
        message: "Invalid company size.",
      });
      return;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: "No valid profile fields were provided.",
      });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "Employer account not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Company profile updated successfully.",
      profile: {
        name: updatedUser.name,
        email: updatedUser.email,
        ...(updatedUser.companyProfile ?? {}),      },
    });
  } catch (error: unknown) {
    console.error("Update employer profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update employer profile.",
    });
  }
};
