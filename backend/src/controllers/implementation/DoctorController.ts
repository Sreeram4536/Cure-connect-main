import { Request, Response } from "express";
import { DoctorService } from "../../services/implementation/DoctorService";
import { IDoctorController } from "../interface/IdoctorController.interface";
import { HttpStatus } from "../../constants/status.constants";
import { HttpResponse } from "../../constants/responseMessage.constants";
import { DoctorDTO } from "../../types/doctor";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.utils";
import { DoctorSlotService } from "../../services/implementation/SlotService";
import { addTokenToBlacklist } from "../../utils/tokenBlacklist.util";
import jwt from "jsonwebtoken";

export class DoctorController implements IDoctorController {
  constructor(
    private _doctorService: DoctorService,
    private _slotService: DoctorSlotService
  ) {}

  async registerDoctor(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        email,
        password,
        experience,
        about,
        speciality,
        degree,
        fees,
        address,
      } = req.body;

      const imageFile = req.file;

      if (!imageFile) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Doctor image is required",
        });
        return;
      }

      const doctorDTO: DoctorDTO = {
        name,
        email,
        password,
        experience,
        about,
        speciality,
        degree,
        fees: Number(fees),
        address: JSON.parse(address),
        imagePath: imageFile.path,
      };

      await this._doctorService.registerDoctor(doctorDTO);

      res.status(HttpStatus.CREATED).json({
        success: true,
        message: HttpResponse.DOCTOR_REGISTER_SUCCESS,
      });
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async changeAvailability(req: Request, res: Response): Promise<void> {
    try {
      const docId = (req as any).docId || req.params.doctorId || req.params.id;
      await this._doctorService.toggleAvailability(docId);
      res.status(HttpStatus.OK).json({
        success: true,
        message: HttpResponse.DOCTOR_AVAILABILITY_CHANGE,
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async getDoctorsPaginated(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const speciality = req.query.speciality as string | undefined;
      const search = req.query.search as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
      if (page && limit) {
        const result = await this._doctorService.getDoctorsPaginated(page, limit, speciality, search, sortBy, sortOrder);
        res.status(HttpStatus.OK).json({ success: true, ...result });
      } else {
        const doctors = await this._doctorService.getAllDoctors();
        res.status(HttpStatus.OK).json({ success: true, data: doctors });
      }
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
    }
  }

  async loginDoctor(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const { token: accessToken, refreshToken } =
        await this._doctorService.loginDoctor(email, password);

      res.cookie("refreshToken_doctor", refreshToken, {
        httpOnly: true,
        path: "/api/doctor/refresh-token",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(HttpStatus.OK).json({
        success: true,
        accessToken,
        refreshToken,
        message: HttpResponse.LOGIN_SUCCESS,
      });
    } catch (error) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: HttpResponse.UNAUTHORIZED,
      });
    }
  }

  async refreshDoctorToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken_doctor;

      if (!refreshToken) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: HttpResponse.REFRESH_TOKEN_MISSING,
        });
        return;
      }

      const decoded = verifyRefreshToken(refreshToken);

const doctor = await this._doctorService.getDoctorProfile(decoded.id);
if (!doctor) {
   res.status(HttpStatus.UNAUTHORIZED).json({
    success: false,
    message: "Doctor not found",
  });
  return
}
const newAccessToken = generateAccessToken(doctor._id!, doctor.email, "doctor");
const newRefreshToken = generateRefreshToken(doctor._id!);

      res.cookie("refreshToken_doctor", newRefreshToken, {
        httpOnly: true,
        path: "/api/doctor/refresh-token",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(HttpStatus.OK).json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: HttpResponse.REFRESH_TOKEN_FAILED,
      });
    }
  }

  async logoutDoctor(req: Request, res: Response): Promise<void> {
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
    res.clearCookie("refreshToken_doctor", {
      httpOnly: true,
      path: "/api/doctor/refresh-token",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(HttpStatus.OK).json({
      success: true,
      message: HttpResponse.LOGOUT_SUCCESS,
    });
  }

  
  async appointmentsDoctorPaginated(req: Request, res: Response): Promise<void> {
    try {
      const docId = (req as any).docId;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      if (page && limit) {
        const result = await this._doctorService.getDoctorAppointmentsPaginated(docId, page, limit);
        res.status(HttpStatus.OK).json({ success: true, ...result });
      } else {
        const appointments = await this._doctorService.getDoctorAppointments(docId);
        res.status(HttpStatus.OK).json({ success: true, data: appointments });
      }
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
    }
  }

  
  async appointmentConfirm(req: Request, res: Response): Promise<void> {
    try {
      const docId = (req as any).docId;
      const { appointmentId } = req.params;

      await this._doctorService.confirmAppointment(docId, appointmentId);

      res
        .status(HttpStatus.OK)
        .json({ success: true, message: HttpResponse.APPOINTMENT_CONFIRMED });
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  
  async appointmentCancel(req: Request, res: Response): Promise<void> {
    try {
      const docId = (req as any).docId;
      const { appointmentId } = req.params;

      await this._doctorService.cancelAppointment(docId, appointmentId);

      res
        .status(HttpStatus.OK)
        .json({ success: true, message: HttpResponse.APPOINTMENT_CANCELLED });
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: (error as Error).message });
    }
  }

  async doctorProfile(req: Request, res: Response): Promise<void> {
    try {
      const doctId = (req as any).docId;
      const profileData = await this._doctorService.getDoctorProfile(doctId);
      res.json({ success: true, profileData });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: (error as Error).message });
    }
  }

  async updateDoctorProfile(req: Request, res: Response): Promise<void> {
    try {
      const doctId = req.body.doctId;
      const { name, speciality, degree, experience, about, fees, address } =
        req.body;

      const imageFile = req.file;

      console.log("Received body:", req.body);
      console.log("Received file:", imageFile);

      let parsedAddress;
      try {
        parsedAddress = JSON.parse(address);
      } catch (err) {
        console.error("Address parsing error:", err);
        res
          .status(400)
          .json({ success: false, message: "Invalid address format" });
        return;
      }

      await this._doctorService.updateDoctorProfile({
        doctId,
        name,
        speciality,
        degree,
        experience,
        about,
        fees: Number(fees),
        address: parsedAddress,
        imagePath: imageFile?.path,
      });

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Doctor profile updated successfully",
      });
    } catch (error) {
      console.error("Doctor profile update failed:", error);
      res.status(500).json({
        success: false,
        message: (error as Error).message,
        error: (error as Error).stack,
      });
    }
  }



  async getMonthlySlots(req: Request, res: Response): Promise<void> {
  try {
    const doctorId = (req as any).docId;
    const { year, month } = req.query;
    const data = await this._slotService.getMonthlySlots(doctorId, +year!, +month!);
    res.json({ success: true, slots:data });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

async getSlotsForDate(req: Request, res: Response): Promise<void> {
  try {
    const doctorId = (req as any).docId;
    const { date } = req.query;
    
    if (!date) {
      res.status(400).json({ success: false, message: "Date parameter is required" });
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(String(date))) {
      res.status(400).json({ success: false, message: "Invalid date format. Use YYYY-MM-DD" });
      return;
    }

    const data = await this._slotService.getSlotsForDate(doctorId, String(date));
    res.json({ success: true, slots: data });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

async updateDaySlot(req: Request, res: Response): Promise<void> {
  try {
    const doctorId = (req as any).docId;
    const { date, slots, isCancelled } = req.body;
    const data = await this._slotService.updateDaySlot(doctorId, date, slots, isCancelled);
    res.json({ success: true, slots:data });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

  
  async getTopDoctors(req: Request, res: Response): Promise<void> {
    try {
      const status = (req.query.status as string) || "approved";
      const limit = parseInt(req.query.limit as string) || 10;
      
      const doctors = await this._doctorService.getDoctorsByStatusAndLimit(status, limit);
      res.status(200).json({ success: true, doctors });
    } catch (error) {
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }

}
