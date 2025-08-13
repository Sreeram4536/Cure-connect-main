import multer from 'multer';
import path from 'path';
import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const chatUploadsDir = path.join(uploadsDir, 'chat');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(chatUploadsDir)) {
  fs.mkdirSync(chatUploadsDir, { recursive: true });
}

// Define allowed file types
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const allowedDocumentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const allowedMimeTypes = [...allowedImageTypes, ...allowedDocumentTypes];

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, chatUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedOriginalName}`);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 10, // Maximum 10 files per upload
  },
});

// Middleware for handling multiple file uploads
export const uploadChatFiles = upload.array('files', 10);

// Helper function to determine file type
export const getFileType = (mimeType: string): "image" | "document" => {
  if (allowedImageTypes.includes(mimeType)) {
    return "image";
  }
  return "document";
};

// Error handling middleware for multer
export const handleUploadError: express.ErrorRequestHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        res.status(400).json({
          success: false,
          message: 'File size too large. Maximum allowed size is 50MB per file.',
        });
        return;
      case 'LIMIT_FILE_COUNT':
        res.status(400).json({
          success: false,
          message: 'Too many files. Maximum allowed is 10 files per upload.',
        });
        return;
      case 'LIMIT_UNEXPECTED_FILE':
        res.status(400).json({
          success: false,
          message: 'Unexpected field name. Use "files" for file uploads.',
        });
        return;
      default:
        res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`,
        });
        return;
    }
  }

  if (error.message.includes('File type')) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
    return;
  }

  next(error);
};

// Utility function to clean up uploaded files in case of error
export const cleanupUploadedFiles = (files: Express.Multer.File[]) => {
  files.forEach(file => {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};

// Function to get file URL for serving
export const getFileUrl = (filePath: string): string => {
  const relativePath = path.relative(chatUploadsDir, filePath);
  return `/api/chat/files/${relativePath}`;
};

