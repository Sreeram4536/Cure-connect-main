import { Request, Response, NextFunction } from "express";
import multer, { StorageEngine } from "multer";
import path from "path";

const storage: StorageEngine = multer.diskStorage({
  destination: function (req: Request, file, callback) {
    callback(null, "uploads/");
  },
  filename: function (req: Request, file, callback) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    callback(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for chat attachments (images and documents)
const fileFilter = (req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  // Allow images
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
  }
  // Allow common document types
  else if (file.mimetype === 'application/pdf' ||
           file.mimetype === 'application/msword' ||
           file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
           file.mimetype === 'text/plain' ||
           file.mimetype === 'application/vnd.ms-excel' ||
           file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    callback(null, true);
  }
  else {
    callback(new Error('Invalid file type. Only images and documents are allowed.'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export default upload;
