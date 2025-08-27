import { Request } from "express";

export interface AuthRequest extends Request {
  userId?: string;
  docId?: string;
  adminId?: string;
  files?: Express.Multer.File[]; 
  file?: Express.Multer.File;    
}

export interface JwtPayloadExt {
  id: string;
  email?: string;
  role?: "user" | "doctor" | "admin";
  exp?: number;
  iat?: number;
}


export interface CustomRequest extends Request {
  file?: Express.Multer.File;
}
