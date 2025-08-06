import { IAdminRepository } from "../../repositories/interface/IAdminRepository";
import { IAdminService } from "../interface/IAdminService";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { DoctorData, DoctorDTO } from "../../types/doctor";
import { isValidEmail, isValidPassword } from "../../utils/validator";
import dotenv from "dotenv";
import { AppointmentDocument, AppointmentTypes } from "../../types/appointment";
import { IDoctorRepository } from "../../repositories/interface/IDoctorRepository";
import { adminData, AdminDocument } from "../../types/admin";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.utils";
import { PaginationResult } from "../../repositories/interface/IAdminRepository";
import { WalletService } from "./WalletService";
import { UserRepository } from "../../repositories/implementation/UserRepository";
import { SlotLockService } from "./SlotLockService";
import { AppointmentRepository } from "../../repositories/implementation/AppointmentRepository";
import { DoctorRepository } from "../../repositories/implementation/DoctorRepository";
dotenv.config();

export class AdminService implements IAdminService {
  constructor(
    private readonly _adminRepository: IAdminRepository,
    private readonly _doctorRepository: IDoctorRepository,
    private readonly _walletService = new WalletService(),
    private readonly _userRepository = new UserRepository(),
    private readonly _slotLockService = new SlotLockService(
      new AppointmentRepository(),
      new UserRepository(),
      new DoctorRepository()
    )
  ) {}

async login(email: string, password: string): Promise<{ admin: AdminDocument, accessToken: string, refreshToken: string }> {
  const admin = await this._adminRepository.findByEmail(email);
  if (!admin) throw new Error("Admin not found");

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(admin._id.toString(), admin.email, "admin");
  const refreshToken = generateRefreshToken(admin._id.toString(), "admin");

  return { admin, accessToken, refreshToken };
}

async getAdminById(id: string): Promise<AdminDocument | null> {
  return this._adminRepository.findAdminById(id);
}


  async validateCredentials(email: string, password: string): Promise<adminData> {
  const admin = await this._adminRepository.findByEmail(email);
  if (!admin) throw new Error("Admin not found");

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) throw new Error("Invalid credentials");

  return admin;
}


  async addDoctor(data: DoctorDTO): Promise<string> {
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
      imagePath,
    } = data;

    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      throw new Error("All Fields Required");
    }

    if (!isValidEmail(email)) {
      throw new Error("Invalid Email");
    }

    if (!isValidPassword(password)) {
      throw new Error(
        "Password must be at least 8 characters long, contain at least 1 letter, 1 number, and 1 special character"
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let imageUrl = "";
    if (imagePath) {
      const uploadResult = await cloudinary.uploader.upload(imagePath, {
        resource_type: "image",
      });
      imageUrl = uploadResult.secure_url;
    }

    const doctorData: DoctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
      date: new Date(),
    };

    await this._adminRepository.saveDoctor(doctorData);
    return "Doctor added successfully";
  }

  async approveDoctor(doctorId: string): Promise<string> {
    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) throw new Error("Doctor not found");
    if (doctor.status === "approved")
      throw new Error("Doctor already approved");

    doctor.status = "approved";
    await this._doctorRepository.save(doctor);
    return "Doctor approved successfully";
  }

  async rejectDoctor(doctorId: string): Promise<string> {
    const doctor = await this._doctorRepository.findById(doctorId);
    if (!doctor) throw new Error("Doctor not found");
    if (doctor.status === "rejected")
      throw new Error("Doctor already rejected");

    doctor.status = "rejected";
    await this._doctorRepository.save(doctor);
    return "Doctor rejected successfully";
  }

  async getDoctors(): Promise<any[]> {
    return await this._adminRepository.getAllDoctors();
  }

  async getDoctorsPaginated(page: number, limit: number): Promise<PaginationResult<any>> {
    return await this._adminRepository.getDoctorsPaginated(page, limit);
  }

  async getUsers(): Promise<any[]> {
    return await this._adminRepository.getAllUsers();
  }

  async getUsersPaginated(page: number, limit: number): Promise<PaginationResult<any>> {
    return await this._adminRepository.getUsersPaginated(page, limit);
  }

  async toggleUserBlock(userId: string, block: boolean): Promise<string> {
    return await this._adminRepository.toggleUserBlock(userId,block);
  }

  async toggleDoctorBlock(doctorId: string, block: boolean): Promise<string> {
    return await this._adminRepository.toggleDoctorBlock(doctorId, block);
  }

  async listAppointments(): Promise<AppointmentDocument[]> {
    return await this._adminRepository.getAllAppointments();
  }

  async listAppointmentsPaginated(page: number, limit: number): Promise<PaginationResult<AppointmentTypes>> {
    return await this._adminRepository.getAppointmentsPaginated(page, limit);
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    try {
      console.log(`Admin cancelling appointment: ${appointmentId}`);
      
      // Get appointment details to check if payment was made
      const appointment = await this._adminRepository.findPayableAppointment(appointmentId);
      
      console.log(`Found appointment for admin cancellation:`, {
        appointmentId: appointment._id,
        userId: appointment.userId,
        payment: appointment.payment,
        amount: appointment.amount,
        status: appointment.status
      });
      
      // Process refund BEFORE cancelling the appointment
      if (appointment.payment && appointment.amount > 0) {
        console.log(`Processing refund to wallet for admin cancellation: ${appointment.amount}`);
        await this._walletService.processAppointmentCancellation(
          appointment.userId,
          appointmentId,
          appointment.amount,
          'admin'
        );
        console.log(`Refund processed successfully for admin cancellation`);
      } else {
        console.log(`No refund needed for admin cancellation - payment: ${appointment.payment}, amount: ${appointment.amount}`);
      }
      
      // Use SlotLockService to properly cancel appointment and release slot AFTER refund
      const result = await this._slotLockService.cancelAppointment({ appointmentId });
      console.log(`Slot lock service result:`, result);
      
      if (!result.success) {
        throw new Error(result.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error(`Error in admin cancelAppointment:`, error);
      throw error;
    }
  }
}
