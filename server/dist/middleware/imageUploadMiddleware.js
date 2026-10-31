import multer from "multer";
const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
];
const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024, // 2 MB
        files: 1,
    },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
        }
        cb(null, true);
    },
});
export default imageUpload;
//# sourceMappingURL=imageUploadMiddleware.js.map