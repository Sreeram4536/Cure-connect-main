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
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Authentication Failed. Login Again",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (await isTokenBlacklisted(token)) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Token is blacklisted. Please login again.",
      });
      return;
    }

    const decoded = verifyAccessToken(token);
    (req as any).docId = decoded.id;
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
