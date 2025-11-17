// // middleware/authRole.ts

// import { Request, Response, NextFunction } from "express";
// import { HttpStatus } from "../constants/status.constants";
// import { verifyAccessToken, verifyRefreshToken, generateAccessToken } from "../utils/jwt.utils";
// import User from "../models/userModel";
// import Doctor from "../models/doctorModel";
// import Admin from "../models/adminModel";

// const roleModelMap = {
//   user: User,
//   doctor: Doctor,
//   admin: Admin,
// };

// const refreshCookieMap = {
//   user: "refreshToken_user",
//   doctor: "refreshToken_doctor",
//   admin: "refreshToken_admin",
// };

// const authRole = (allowedRoles: Array<"user" | "doctor" | "admin">) => {
//   return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const authHeader = req.headers.authorization;

//       if (!authHeader || !authHeader.startsWith("Bearer ")) {
//         res.status(HttpStatus.UNAUTHORIZED).json({
//           success: false,
//           message: "Authentication failed. Token missing or malformed.",
//         });
//         return;
//       }

//       const token = authHeader.split(" ")[1];
      
//       try {
//         const decoded = verifyAccessToken(token);

//         if (!allowedRoles.includes(decoded.role)) {
//           res.status(HttpStatus.FORBIDDEN).json({
//             success: false,
//             message: "Access denied. Insufficient permissions.",
//           });
//           return;
//         }

//         switch (decoded.role) {
//           case "user":
//             const user = await User.findById(decoded.id);
//             if (!user || user.isBlocked) {
//               res.status(HttpStatus.FORBIDDEN).json({
//                 success: false,
//                 blocked:true,
//                 message: "Access denied or user blocked",
//               });
//               return;
//             }
//             (req as any).userId = user._id;
//             break;

//           case "doctor":
//             const doctor = await Doctor.findById(decoded.id);
//             if (!doctor || doctor.isBlocked) {
//               res.status(HttpStatus.FORBIDDEN).json({
//                 success: false,
//                 blocked:true,
//                 message: "Access denied or doctor blocked",
//               });
//               return;
//             }
//             (req as any).docId = doctor._id;
//             break;

//           case "admin":
//             const admin = await Admin.findOne({ email: decoded.email });
//             if (!admin) {
//               res.status(HttpStatus.UNAUTHORIZED).json({
//                 success: false,
//                 message: "Admin not found",
//               });
//               return;
//             }
//             (req as any).adminId = admin._id;
//             break;
//         }

//         next();
//       } catch (tokenError: any) {
        
//         if (tokenError.name === 'TokenExpiredError') {
//           console.log("Token expired in authRole, attempting refresh...");
          
//           try {
//             const refreshToken = req.cookies?.refreshToken_user || 
//                                req.cookies?.refreshToken_doctor || 
//                                req.cookies?.refreshToken_admin;
            
//             if (!refreshToken) {
//               res.status(HttpStatus.UNAUTHORIZED).json({
//                 success: false,
//                 message: "Refresh token not provided",
//               });
//               return;
//             }

            
//             const refreshDecoded = verifyRefreshToken(refreshToken);
            
            
//             // let userType = refreshDecoded.role || 'user';
            
            
//             // if (!refreshDecoded.role) {
//             //   if (req.cookies?.refreshToken_doctor) {
//             //     userType = 'doctor';
//             //   } else if (req.cookies?.refreshToken_admin) {
//             //     userType = 'admin';
//             //   }
//             // }
//             let userType: "user" | "doctor" | "admin" | null = null;

// if (req.cookies?.refreshToken_user) {
//   userType = "user";
// } else if (req.cookies?.refreshToken_doctor) {
//   userType = "doctor";
// } else if (req.cookies?.refreshToken_admin) {
//   userType = "admin";
// }

// if (!userType) {
//    res.status(HttpStatus.UNAUTHORIZED).json({
//     success: false,
//     message: "Unknown user role — refresh token invalid",
//   });
// }


//             // Check if user type is allowed
//             if (!allowedRoles.includes(userType as any)) {
//               res.status(HttpStatus.FORBIDDEN).json({
//                 success: false,
//                 message: "Access denied. Insufficient permissions.",
//               });
//               return;
//             }

//             // Generate new access token
//             const newAccessToken = generateAccessToken(refreshDecoded.id, "", userType as any);
//             res.setHeader('New-Access-Token', newAccessToken);
            
//             // Verify user exists and is not blocked
//             switch (userType) {
//               case "user":
//                 const user = await User.findById(refreshDecoded.id);
//                 if (!user || user.isBlocked) {
//                   res.status(HttpStatus.FORBIDDEN).json({
//                     success: false,
//                     blocked:true,
//                     message: "Access denied or user blocked",
//                   });
//                   return;
//                 }
//                 (req as any).userId = user._id;
//                 break;

//               case "doctor":
//                 const doctor = await Doctor.findById(refreshDecoded.id);
//                 if (!doctor) {
//                   res.status(HttpStatus.FORBIDDEN).json({
//                     success: false,
//                     blocked:true,
//                     message: "Access denied or doctor blocked",
//                   });
//                   return;
//                 }
//                 (req as any).docId = doctor._id;
//                 break;

//               case "admin":
//                 const admin = await Admin.findById(refreshDecoded.id);
//                 if (!admin) {
//                   res.status(HttpStatus.UNAUTHORIZED).json({
//                     success: false,
//                     message: "Admin not found",
//                   });
//                   return;
//                 }
//                 (req as any).adminId = admin._id;
//                 break;
//             }
            
//             console.log(`Token refreshed for ${userType}:`, refreshDecoded.id);
//             next();
            
//           } catch (refreshError: any) {
//             console.log("Refresh token error in authRole:", refreshError.message);
//             res.status(HttpStatus.UNAUTHORIZED).json({
//               success: false,
//               message: "Invalid refresh token",
//             });
//           }
//         } else {
          
//           res.status(HttpStatus.UNAUTHORIZED).json({
//             success: false,
//             message: "Invalid token",
//           });
//         }
//       }
//     } catch (error: any) {
//       console.log("Role Auth Error:", error.message);
//       res.status(HttpStatus.UNAUTHORIZED).json({
//         success: false,
//         message: "Invalid or expired token",
//       });
//     }
//   };
// };

// export default authRole;


// middleware/authRole.ts

import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../constants/status.constants";
import { verifyAccessToken, verifyRefreshToken, generateAccessToken } from "../utils/jwt.utils";
import User from "../models/userModel";
import Doctor from "../models/doctorModel";
import Admin from "../models/adminModel";

const refreshCookieMap: Record<string, string> = {
  user: "refreshToken_user",
  doctor: "refreshToken_doctor",
  admin: "refreshToken_admin",
};

const authRole = (allowedRoles: Array<"user" | "doctor" | "admin">) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: "Authentication failed. Token missing or malformed.",
        });
        return;
      }

      const token = authHeader.split(" ")[1];

      try {
        const decoded = verifyAccessToken(token);

        if (!allowedRoles.includes(decoded.role)) {
          res.status(HttpStatus.FORBIDDEN).json({
            success: false,
            message: "Access denied. Insufficient permissions.",
          });
          return;
        }

        // ---------- ROLE-BASED VALIDATION ----------
        if (decoded.role === "user") {
          const user = await User.findById(decoded.id);
          if (!user || user.isBlocked) {
            res.status(HttpStatus.FORBIDDEN).json({
              success: false,
              blocked: true,
              message: "User is blocked",
            });
            return;
          }
          (req as any).userId = user._id;
        }

        if (decoded.role === "doctor") {
          const doctor = await Doctor.findById(decoded.id);
          if (!doctor || doctor.isBlocked) {
            res.status(HttpStatus.FORBIDDEN).json({
              success: false,
              blocked: true,
              message: "Doctor is blocked",
            });
            return;
          }
          (req as any).docId = doctor._id;
        }

        if (decoded.role === "admin") {
          const admin = await Admin.findOne({ email: decoded.email });
          if (!admin) {
            res.status(HttpStatus.UNAUTHORIZED).json({
              success: false,
              message: "Admin not found",
            });
            return;
          }
          (req as any).adminId = admin._id;
        }

        return next();
      } catch (tokenError: any) {
        // ------------------ TOKEN EXPIRED → USE REFRESH ------------------
        if (tokenError.name === "TokenExpiredError") {
          console.log("Token expired in authRole, attempting refresh...");

          let refreshToken: string | null = null;
          let userType: "user" | "doctor" | "admin" | null = null;

          // ✔ Identify the correct refresh token ONLY based on allowed roles
          for (const role of allowedRoles) {
            const cookieName = refreshCookieMap[role];
            if (req.cookies?.[cookieName]) {
              refreshToken = req.cookies[cookieName];
              userType = role;
              break;
            }
          }

          if (!refreshToken || !userType) {
            res.status(HttpStatus.UNAUTHORIZED).json({
              success: false,
              message: "Refresh token missing or invalid role",
            });
            return;
          }

          try {
            const refreshDecoded = verifyRefreshToken(refreshToken);

            // ✔ Generate a new access token
            const newAccessToken = generateAccessToken(
              refreshDecoded.id,
              refreshDecoded.email || "",
              userType
            );

            res.setHeader("New-Access-Token", newAccessToken);

            // ---------- REVALIDATE USER ROLE AGAIN ----------
            if (userType === "user") {
              const user = await User.findById(refreshDecoded.id);
              if (!user || user.isBlocked) {
                res.status(HttpStatus.FORBIDDEN).json({
                  success: false,
                  blocked: true,
                  message: "User is blocked",
                });
                return;
              }
              (req as any).userId = user._id;
            }

            if (userType === "doctor") {
              const doctor = await Doctor.findById(refreshDecoded.id);
              if (!doctor || doctor.isBlocked) {
                res.status(HttpStatus.FORBIDDEN).json({
                  success: false,
                  blocked: true,
                  message: "Doctor is blocked",
                });
                return;
              }
              (req as any).docId = doctor._id;
            }

            if (userType === "admin") {
              const admin = await Admin.findById(refreshDecoded.id);
              if (!admin) {
                res.status(HttpStatus.UNAUTHORIZED).json({
                  success: false,
                  message: "Admin not found",
                });
                return;
              }
              (req as any).adminId = admin._id;
            }

            console.log(`Token refreshed for ${userType}: ${refreshDecoded.id}`);
            return next();
          } catch (refreshErr: any) {
            console.log("Refresh token error:", refreshErr.message);
            res.status(HttpStatus.UNAUTHORIZED).json({
              success: false,
              message: "Invalid refresh token",
            });
            return;
          }
        }

        // INVALID TOKEN (not expired)
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: "Invalid token",
        });
      }
    } catch (error: any) {
      console.log("Role Auth Error:", error.message);
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };
};

export default authRole;
