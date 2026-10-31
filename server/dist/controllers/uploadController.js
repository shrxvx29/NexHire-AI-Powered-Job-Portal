import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";
// --------------------------------------------------
// Upload File to Cloudinary
// --------------------------------------------------
const uploadToCloudinary = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) {
                return reject(error);
            }
            if (!result) {
                return reject(new Error("Cloudinary returned an empty upload result"));
            }
            resolve(result);
        });
        stream.end(buffer);
    });
};
// ==================================================
// 1. UPLOAD RESUME
// POST /api/uploads/resume
// ==================================================
export const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "Please upload a resume PDF file.",
            });
            return;
        }
        const existingUser = await User.findById(req.user._id).select("_id");
        if (!existingUser) {
            res.status(404).json({
                success: false,
                message: "User not found.",
            });
            return;
        }
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: "nexhire/resumes",
            resource_type: "raw",
            public_id: `resume_${req.user._id}_${Date.now()}.pdf`,
        });
        const user = await User.findByIdAndUpdate(req.user._id, {
            resumeUrl: result.secure_url,
        }, {
            new: true,
        }).select("-password");
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found.",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Resume uploaded successfully.",
            resume: {
                url: result.secure_url,
                publicId: result.public_id,
            },
            user,
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unknown upload error";
        console.error("Resume upload failed:", message);
        res.status(500).json({
            success: false,
            message: "Failed to upload resume. Please try again.",
            error: process.env.NODE_ENV === "production"
                ? undefined
                : message,
        });
    }
};
// ==================================================
// 2. UPLOAD PROFILE PICTURE
// POST /api/uploads/profile-picture
// ==================================================
export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "Please select a profile picture.",
            });
            return;
        }
        // Upload image to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: "nexhire/profile-pictures",
            resource_type: "image",
            public_id: `profile_${req.user._id}_${Date.now()}`,
            transformation: [
                {
                    width: 500,
                    height: 500,
                    crop: "limit",
                },
            ],
        });
        // Update user profile
        const user = await User.findByIdAndUpdate(req.user._id, {
            profilePictureUrl: result.secure_url,
        }, {
            new: true,
        }).select("-password");
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found.",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Profile picture uploaded successfully.",
            profilePicture: {
                url: result.secure_url,
                publicId: result.public_id,
            },
            user,
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unknown upload error";
        console.error("Profile picture upload error:", message);
        res.status(500).json({
            success: false,
            message: "Failed to upload profile picture. Please try again.",
        });
    }
};
//# sourceMappingURL=uploadController.js.map