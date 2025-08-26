import { Request, Response } from "express";
import { IAdminService } from "../../services/interface/IAdminService";
import { IAdminController } from "../interface/IadminController.interface";
import { CustomRequest } from "../../types/customRequest";
import { HttpStatus } from "../../constants/status.constants";
import { DoctorDTO } from "../../types/doctor";
import { HttpResponse } from "../../constants/responseMessage.constants";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt.utils";
import { addTokenToBlacklist } from "../../utils/tokenBlacklist.util";
import jwt from "jsonwebtoken";

export class AdminController implements IAdminController {
  constructor(private _adminService: IAdminService) {}

  // For Admin login
   async loginAdmin(req: Request, res: Response): Promise<void> {
    try {
      console.log('Admin login request received');
      const { email, password } = req.body;
      if (!email || !password) {
        console.log('Missing email or password');
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: HttpResponse.ADMIN_FIELDS_REQUIRED,
        });
        return;
      }

      console.log('Attempting admin login for email:', email);
      const { admin, accessToken, refreshToken } = await this._adminService.login(email, password);

      console.log('Admin login successful, setting cookie');
      res
        .cookie("refreshToken_admin", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .status(HttpStatus.OK)
        .json({
          success: true,
          token: accessToken,
          message: HttpResponse.LOGIN_SUCCESS,
        });
      console.log('Admin login response sent');
    } catch (error: any) {
      console.log('Admin login error:', error.message);
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: HttpResponse.UNAUTHORIZED,
      });
    }
  }

  // Admin Refresh Token
  async refreshAdminToken(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 Admin refresh token request received');
      console.log('🔍 Cookies:', req.cookies);
      
      const refreshToken = req.cookies?.refreshToken_admin;
      if (!refreshToken) {
        console.log('No refresh token found in cookies');
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: HttpResponse.REFRESH_TOKEN_MISSING,
        });
        return;
      }

      console.log(' Refresh token found, verifying...');
      const decoded = verifyRefreshToken(refreshToken);
      console.log(' Decoded refresh token:', decoded);

      if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
        console.log(' Invalid refresh token structure');
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: HttpResponse.REFRESH_TOKEN_INVALID,
        });
        return;
      }

      console.log('🔍 Looking up admin with ID:', decoded.id);
      const admin = await this._adminService.getAdminById(decoded.id);
      if (!admin) {
        console.log(' Admin not found with ID:', decoded.id);
        throw new Error("Admin not found");
      }

      console.log(' Admin found, generating new tokens');
      const newAccessToken = generateAccessToken(admin._id, admin.email, "admin");
      const newRefreshToken = generateRefreshToken(admin._id, "admin");

      console.log(' Setting new refresh token cookie');
      res.cookie("refreshToken_admin", newRefreshToken, {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      console.log(' Admin refresh successful');
      res.status(HttpStatus.OK).json({
        success: true,
        token: newAccessToken,
      });
    } catch (error: any) {
      console.log('❌ Admin refresh error:', error.message);
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: HttpResponse.REFRESH_TOKEN_FAILED,
      });
    }
  }

  // Admin Logout
  async logoutAdmin(req: Request, res: Response): Promise<void> {
    // Blacklist the access token if present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded: any = jwt.decode(token);
        
        if (decoded && decoded.exp) {
          const expiresAt = new Date(decoded.exp * 1000);
          await addTokenToBlacklist(token, expiresAt);
        }
      } catch (e) {
        
      }
    }
    res.clearCookie("refreshToken_admin", {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: HttpResponse.LOGOUT_SUCCESS,
    });
  }


  // To add doctor
  async addDoctor(req: CustomRequest, res: Response): Promise<void> {
    try {
      const {
        name,
        email,
        password,
        speciality,
        degree,
        experience,
        about,
        fees,
        address,
      } = req.body;

      const imageFile = req.file;

      const doctorDTO: DoctorDTO = {
        name,
        email,
        password,
        speciality,
        degree,
        experience,
        about,
        fees: Number(fees),
        address: JSON.parse(address),
        imagePath: imageFile?.path,
      };
      const message = await this._adminService.addDoctor(doctorDTO);
      res.status(HttpStatus.CREATED).json({ success: true, message });
      return;
    } catch (error) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: (error as Error).message });
    }
  }

  // To get all the doctors
  async getDoctors(req: Request, res: Response): Promise<void> {
    try {
      const doctors = await this._adminService.getDoctors();
      res.status(HttpStatus.OK).json({ success: true, doctors });
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  // To get paginated doctors (with search)
  async getDoctorsPaginated(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const search = req.query.search ? (req.query.search as string).trim() : "";
      if (page && limit) {
        const result = await this._adminService.getDoctorsPaginated(page, limit, search);
        res.status(HttpStatus.OK).json({ success: true, ...result });
      } else {
        const doctors = await this._adminService.getDoctors();
        res.status(HttpStatus.OK).json({ success: true, data: doctors });
      }
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
    }
  }

  // To get all users
  async getAllUsers(req: Request, res: Response): Promise<void> {
     const search = req.query.search ? (req.query.search as string).trim() : "";
    try {
      const users = await this._adminService.getUsers(search);
      res.status(HttpStatus.OK).json({ success: true, users });
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  // To get paginated users
  // async getUsersPaginated(req: Request, res: Response): Promise<void> {
  //   try {
      
  //     const page = req.query.page ? parseInt(req.query.page as string) : undefined;
  //     const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  //     if (page && limit) {
  //       const result = await this._adminService.getUsersPaginated(page, limit);
  //       res.status(HttpStatus.OK).json({ success: true, ...result });
  //     } else {
  //       const users = await this._adminService.getUsers();
  //       res.status(HttpStatus.OK).json({ success: true, data: users });
  //     }
  //   } catch (error) {
  //     res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
  //   }
  // }
  
async getUsersPaginated(req: Request, res: Response): Promise<void> {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const search = req.query.search ? (req.query.search as string).trim() : ""; // Extract search query
    
    if (page && limit) {
      const result = await this._adminService.getUsersPaginated(page, limit, search); // Pass search parameter
      res.status(HttpStatus.OK).json({ success: true, ...result });
    } else {
      const users = await this._adminService.getUsers(search); // Pass search to getUsers too
      res.status(HttpStatus.OK).json({ success: true, data: users });
    }
  } catch (error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
  }
}

  // To toggle the state of user
  async toggleUserBlock(req: Request, res: Response): Promise<void> {
      console.log("🔔 toggleUserBlock hit");
    try {
    const { userId } = req.params; // ✅ This is correct now
    const { block } = req.body as { block?: boolean };

    console.log("PARAM userId:", userId);
    console.log("BODY block:", block);

      if (typeof block !== "boolean") {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: HttpResponse.BLOCK_STATUS_INVALID,
        });
        return;
      }

      const message = await this._adminService.toggleUserBlock(userId, block);
      res.status(HttpStatus.OK).json({ success: true, message });
    } catch (error) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: (error as Error).message });
    }
  }

  async approveDoctor(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.id;
      const message = await this._adminService.approveDoctor(doctorId);
      res.status(HttpStatus.OK).json({ success: true, message });
    } catch (error) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: (error as Error).message });
    }
  }

  async rejectDoctor(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.id;
      const message = await this._adminService.rejectDoctor(doctorId);
      res.status(HttpStatus.OK).json({ success: true, message });
    } catch (error) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: (error as Error).message });
    }
  }

  // For getting all the appointments
  async appointmentsList(req: Request, res: Response): Promise<void> {
    try {
      const appointments = await this._adminService.listAppointments();
      res.status(HttpStatus.OK).json({ success: true, appointments });
    } catch (error) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: (error as Error).message });
    }
  }

  // For getting paginated appointments (with search)
  async appointmentsListPaginated(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const search = req.query.search ? (req.query.search as string).trim() : "";
      if (page && limit) {
        const result = await this._adminService.listAppointmentsPaginated(page, limit, search);
        res.status(HttpStatus.OK).json({ success: true, ...result });
      } else {
        const appointments = await this._adminService.listAppointments();
        res.status(HttpStatus.OK).json({ success: true, data: appointments });
      }
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
    }
  }

  // For appointment cancelation
  async adminCancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;

      await this._adminService.cancelAppointment(appointmentId);
      res
        .status(HttpStatus.OK)
        .json({ success: true, message: HttpResponse.APPOINTMENT_CANCELLED });
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  // For admin dashboard
  async adminDashboard(req: Request, res: Response): Promise<void> {
     const search = req.query.search ? (req.query.search as string).trim() : "";
    try {
      const doctors = await this._adminService.getDoctors();
      const users = await this._adminService.getUsers(search);
      const appointments = await this._adminService.listAppointments();

      const dashData = {
        doctors: doctors.length,
        patients: users.length,
        appointments: appointments.length,
        latestAppointments: appointments.reverse().slice(0, 5),
      };

      res.status(HttpStatus.OK).json({ success: true, dashData });
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  async toggleDoctorBlock(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.params;
      const { block } = req.body as { block?: boolean };
      if (typeof block !== "boolean") {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: HttpResponse.BLOCK_STATUS_INVALID,
        });
        return;
      }
      const message = await this._adminService.toggleDoctorBlock(doctorId, block);
      res.status(HttpStatus.OK).json({ success: true, message });
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }
}
