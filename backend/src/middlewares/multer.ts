import { Request, Response, NextFunction } from "express";
import multer, { StorageEngine } from "multer";
import path from "path";

const storage: StorageEngine = multer.diskStorage({
  destination: function (req: Request, file, callback) {
    callback(null, 'uploads/');
  },
  filename: function (req: Request, file, callback) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    callback(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for chat messages (images, documents, etc.)
const fileFilter = (req: Request, file: any, callback: any) => {
  // Allow images, documents, and other common file types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/avi'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Invalid file type. Only images, documents, audio, and video files are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Specific upload configurations
export const uploadSingle = upload.single("image");
export const uploadChatFiles = upload.array("files", 5); // Allow up to 5 files per message

export default upload;
