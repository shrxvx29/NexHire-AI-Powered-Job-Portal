import express, {} from "express";
import cors from "cors";
import dotenv from "dotenv";
import { setServers } from "node:dns";
import connectDB from "./config/db.js";
// Routes
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
dotenv.config();
const app = express();
// Middlewares
const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL,
].filter((origin) => Boolean(origin));
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests without an Origin header.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.error("CORS blocked origin:", origin);
        return callback(new Error(`CORS policy blocked origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
// Health Check
app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "NexHire Backend Server Started Successfully",
    });
});
// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/ai", aiRoutes);
// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});
// Global Error Handler
const globalErrorHandler = (err, _req, res, next) => {
    const error = err instanceof Error ? err : new Error("Unknown server error");
    console.error("Server error:", error.message);
    if (res.headersSent) {
        return next(error);
    }
    const statusCode = typeof err === "object" &&
        err !== null &&
        "status" in err &&
        typeof err.status === "number"
        ? err.status
        : 500;
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : error.message,
    });
};
app.use(globalErrorHandler);
// Start Server
const PORT = Number(process.env.PORT) || 5000;
const startServer = async () => {
    try {
        // DNS configuration for MongoDB Atlas SRV lookup
        setServers(["8.8.8.8", "8.8.4.4"]);
        await connectDB();
        app.listen(PORT, () => {
            console.log(`NexHire server running at http://localhost:${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown startup error";
        console.error("Server startup failed:", message);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map