import multer from "multer";
import type { Request } from "express";

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (
  _req: Request,
  file,
  cb
) => {
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("Only PDF files are allowed"));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

export default upload;