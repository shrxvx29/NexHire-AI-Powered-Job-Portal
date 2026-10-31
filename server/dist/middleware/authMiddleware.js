import jwt from "jsonwebtoken";
import User from "../models/User.js";
// --------------------------------------------------
// JWT Configuration
// --------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
}
// --------------------------------------------------
// 1. PROTECT ROUTES
// JWT Authentication Middleware
// --------------------------------------------------
export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // Check whether token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Not authorized. Please provide a valid token.",
            });
            return;
        }
        // Extract token
        const token = authHeader.split(" ")[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Not authorized. Token is missing.",
            });
            return;
        }
        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET);
        // Validate JWT payload
        if (typeof decoded === "string" ||
            typeof decoded.id !== "string") {
            res.status(401).json({
                success: false,
                message: "Token is invalid or expired.",
            });
            return;
        }
        // Find authenticated user
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            res.status(401).json({
                success: false,
                message: "User no longer exists. Please log in again.",
            });
            return;
        }
        // Attach authenticated user to request
        req.user = user;
        // Continue to next middleware/controller
        next();
    }
    catch (error) {
        // Handle invalid or expired JWT
        if (error instanceof jwt.TokenExpiredError ||
            error instanceof jwt.JsonWebTokenError ||
            error instanceof jwt.NotBeforeError) {
            res.status(401).json({
                success: false,
                message: "Token is invalid or expired.",
            });
            return;
        }
        const message = error instanceof Error
            ? error.message
            : "Unknown authentication error";
        console.error("Authentication error:", message);
        res.status(500).json({
            success: false,
            message: "Authentication failed due to a server error.",
        });
    }
};
// --------------------------------------------------
// 2. EMPLOYER ONLY
// Role-Based Authorization Middleware
// --------------------------------------------------
export const employerOnly = (req, res, next) => {
    // Check authentication
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: "Please log in first.",
        });
        return;
    }
    // Check employer role
    if (req.user.role !== "employer") {
        res.status(403).json({
            success: false,
            message: "Access denied. Employers only.",
        });
        return;
    }
    next();
};
//# sourceMappingURL=authMiddleware.js.map