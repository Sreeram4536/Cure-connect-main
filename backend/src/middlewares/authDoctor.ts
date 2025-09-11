import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../constants/status.constants";
import { verifyAccessToken } from "../utils/jwt.utils";
import { isTokenBlacklisted } from "../utils/tokenBlacklist.util";

const authDoctor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    console.log(`Doctor auth: Authorization header:`, authHeader ? 'Present' : 'Missing');
    console.log(`Doctor auth: Full headers:`, req.headers);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log(`Doctor auth: Invalid or missing authorization header`);
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Authentication Failed. Login Again",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    console.log(`Doctor auth: Token extracted:`, token ? 'Present' : 'Missing');

    if (await isTokenBlacklisted(token)) {
      console.log(`Doctor auth: Token is blacklisted`);
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Token is blacklisted. Please login again.",
      });
      return;
    }

    const decoded = verifyAccessToken(token);
    console.log("Doctor JWT decoded:", decoded);
    (req as any).docId = decoded.id;
    console.log("Set docId in request:", (req as any).docId);
    next();
  } catch (error: any) {
    console.log("Auth Error:", error.message);
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default authDoctor;
