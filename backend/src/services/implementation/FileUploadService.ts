import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

export interface UploadedFile {
  url: string;
  publicId: string;
  originalName: string;
  fileType: string;
  fileSize: number;
}

export class FileUploadService {
  static async uploadFile(filePath: string, originalName: string): Promise<UploadedFile> {
    try {
      // Determine resource type based on file extension
      const ext = path.extname(originalName).toLowerCase();
      let resourceType: 'image' | 'video' | 'raw' = 'raw';
      
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        resourceType = 'image';
      } else if (['.mp4', '.avi', '.mov', '.wmv'].includes(ext)) {
        resourceType = 'video';
      }

      const uploadResult = await cloudinary.uploader.upload(filePath, {
        resource_type: resourceType,
        folder: 'chat_files', // Organize files in a folder
      });

      // Clean up local file
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete local file:", err);
      });

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        originalName,
        fileType: ext,
        fileSize: uploadResult.bytes,
      };
    } catch (error) {
      // Clean up local file on error
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete local file:", err);
      });
      
      throw new Error(`File upload failed: ${(error as Error).message}`);
    }
  }

  static async uploadMultipleFiles(files: Express.Multer.File[]): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file.path, file.originalname)
    );

    return Promise.all(uploadPromises);
  }

  static async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error("Failed to delete file from Cloudinary:", error);
      return false;
    }
  }
}