import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../constants/status.constants";
import { verifyAccessToken, generateAccessToken, verifyRefreshToken } from "../utils/jwt.utils";
import { isTokenBlacklisted } from "../utils/tokenBlacklist.util";

interface AuthenticatedRequest extends Request {
  userId?: string;
  docId?: string;
  adminId?: string;
  userType?: 'user' | 'doctor' | 'admin';
}

const authWithRefresh = async (
  req: AuthenticatedRequest,
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

    try {
      //  to verify the access token
      const decoded = verifyAccessToken(token);
      console.log("JWT decoded:", decoded);
      
      
      if (decoded.role === 'user') {
        req.userId = decoded.id;
        req.userType = 'user';
      } else if (decoded.role === 'doctor') {
        req.docId = decoded.id;
        req.userType = 'doctor';
      } else if (decoded.role === 'admin') {
        req.adminId = decoded.id;
        req.userType = 'admin';
      }
      
      next();
    } catch (tokenError: any) {
      // If token is expired, try to refresh it
      if (tokenError.name === 'TokenExpiredError') {
        console.log("Token expired, attempting refresh...");
        
        try {
          // Get refresh token from cookies
          const refreshToken = req.cookies?.refreshToken_user || 
                             req.cookies?.refreshToken_doctor || 
                             req.cookies?.refreshToken_admin;
          
          if (!refreshToken) {
            res.status(HttpStatus.UNAUTHORIZED).json({
              success: false,
              message: "Refresh token not provided",
            });
            return;
          }

          // Verify refresh token
          const refreshDecoded = verifyRefreshToken(refreshToken);
            let userType = refreshDecoded.role || 'user';
           
            if (!refreshDecoded.role) {
              if (req.cookies?.refreshToken_doctor) {
                userType = 'doctor';
              } else if (req.cookies?.refreshToken_admin) {
                userType = 'admin';
              }
            }

          // Generate new access token
          const newAccessToken = generateAccessToken(refreshDecoded.id, "", userType as any);
          
          // Set new access token in response header
          res.setHeader('New-Access-Token', newAccessToken);
          
          // Set user info
          if (userType === 'user') {
            req.userId = refreshDecoded.id;
            req.userType = 'user';
          } else if (userType === 'doctor') {
            req.docId = refreshDecoded.id;
            req.userType = 'doctor';
          } else if (userType === 'admin') {
            req.adminId = refreshDecoded.id;
            req.userType = 'admin';
          }
          
          console.log(`Token refreshed for ${userType}:`, refreshDecoded.id);
          next();
          
        } catch (refreshError: any) {
          console.log("Refresh token error:", refreshError.message);
          res.status(HttpStatus.UNAUTHORIZED).json({
            success: false,
            message: "Invalid refresh token",
          });
        }
      } else {
        
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: "Invalid token",
        });
      }
    }
  } catch (error: any) {
    console.log("Auth Error:", error.message);
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export default authWithRefresh; 