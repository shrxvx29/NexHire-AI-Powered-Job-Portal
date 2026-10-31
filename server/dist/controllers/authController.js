import jwt, {} from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import sendEmail from "../config/email.js";
import { welcomeEmail } from "../utils/emailTemplates.js";
// --------------------------------------------------
// JWT Configuration
// --------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
}
const JWT_EXPIRES_IN = "7d";
// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
// --------------------------------------------------
// Error Helper
// --------------------------------------------------
const getErrorMessage = (error) => {
    return error instanceof Error
        ? error.message
        : "Unknown error occurred";
};
const isDuplicateKeyError = (error) => {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000);
};
// ==================================================
// 1. REGISTER
// POST /api/auth/register
// ==================================================
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        // Validate required fields
        if (typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password) {
            res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            });
            return;
        }
        // Validate public registration role
        const userRole = role === undefined ? "seeker" :
            role === "seeker" || role === "employer" ? role :
                "seeker";
        if (role !== undefined && role !== "seeker" && role !== "employer") {
            res.status(400).json({
                success: false,
                message: "Invalid user role",
            });
            return;
        }
        const normalizedEmail = email.trim().toLowerCase();
        // Check existing user
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "Email already exists",
            });
            return;
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: userRole,
        });
        // Generate JWT
        const token = generateToken(user._id.toString());
        // Send welcome email
        // Email failure should not undo successful registration
        try {
            const { subject, html } = welcomeEmail(user.name);
            await sendEmail({
                to: user.email,
                subject,
                html,
            });
        }
        catch (emailError) {
            console.error("Welcome email failed:", getErrorMessage(emailError));
        }
        res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        if (isDuplicateKeyError(error)) {
            res.status(409).json({
                success: false,
                message: "Email already exists",
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Registration failed. Please try again.",
        });
    }
};
// ==================================================
// 2. LOGIN
// POST /api/auth/login
// ==================================================
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate credentials
        if (typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password) {
            res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
            return;
        }
        const normalizedEmail = email.trim().toLowerCase();
        // Find user
        const user = await User.findOne({
            email: normalizedEmail,
        });
        // Verify password
        if (!user ||
            !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Login successful",
            token: generateToken(user._id.toString()),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Login failed. Please try again.",
        });
    }
};
// ==================================================
// 3. GET CURRENT USER
// GET /api/auth/me
// ==================================================
export const getMe = async (req, res) => {
    try {
        // Requires authentication middleware
        const user = await User.findById(req.user._id)
            .select("-password");
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
        });
    }
};
// ==================================================
// 4. UPDATE PROFILE
// PUT /api/auth/profile
// ==================================================
export const updateProfile = async (req, res) => {
    try {
        const { name, bio, skills } = req.body;
        const updates = {};
        // Update name
        if (name !== undefined) {
            if (typeof name !== "string" ||
                !name.trim()) {
                res.status(400).json({
                    success: false,
                    message: "Name cannot be empty",
                });
                return;
            }
            updates.name = name.trim();
        }
        // Update bio
        if (bio !== undefined) {
            if (typeof bio !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Bio must be a string",
                });
                return;
            }
            updates.bio = bio;
        }
        // Update skills
        if (skills !== undefined) {
            if (!Array.isArray(skills) &&
                typeof skills !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Skills must be an array or comma-separated string",
                });
                return;
            }
            const skillsArray = Array.isArray(skills)
                ? skills
                : skills.split(",");
            if (!skillsArray.every((skill) => typeof skill === "string")) {
                res.status(400).json({
                    success: false,
                    message: "Every skill must be a string",
                });
                return;
            }
            updates.skills = skillsArray
                .map((skill) => skill.trim())
                .filter(Boolean);
        }
        // Update database
        const user = await User.findByIdAndUpdate(req.user._id, {
            $set: updates,
        }, {
            new: true,
            runValidators: true,
        }).select("-password");
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update profile",
        });
    }
};
//# sourceMappingURL=authController.js.map