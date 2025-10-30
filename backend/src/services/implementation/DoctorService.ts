import { IDoctorRepository } from "../../repositories/interface/IDoctorRepository";
import bcrypt from "bcrypt";
import { IDoctorService } from "../interface/IDoctorService";
import { AppointmentTypes, AppointmentDTO } from "../../types/appointment";
import { DoctorData, DoctorDTO, DoctorProfileDTO, DoctorListDTO } from "../../types/doctor";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwt.utils";
import { WalletService } from "./WalletService";
import { UserRepository } from "../../repositories/implementation/UserRepository";
import { SlotLockService } from "./SlotLockService";
import { AppointmentRepository } from "../../repositories/implementation/AppointmentRepository";
import { DoctorRepository } from "../../repositories/implementation/DoctorRepository";
import { IWalletService } from "../interface/IWalletService";
import { ISlotLockService } from "../interface/ISlotLockService";

// Extended type that includes _id from MongoDB documents
type AppointmentWithId = AppointmentTypes & { _id?: string };

export interface DoctorDocument extends DoctorData {
  _id: string;
}

export class DoctorService implements IDoctorService {
  constructor(
    private _doctorRepository: IDoctorRepository,
    private readonly _walletService :IWalletService,
    private readonly _slotLockService:ISlotLockService
  ) {}

  private toAppointmentDTO(a: AppointmentWithId): AppointmentDTO {
    return {
      id: a._id?.toString() ?? "",
      _id: a._id?.toString() ?? "",
      userId: String(a.userId),
      docId: String(a.docId),
      slotDate: a.slotDate,
      slotTime: a.slotTime,
      amount: a.amount,
      date: a.date,
      cancelled: a.cancelled,
      payment: a.payment,
      status: a.status,
      isConfirmed: a.isConfirmed,
      isCompleted: a.isCompleted,
      userData: a.userData,
      docData: a.docData,
    };
  }

  async registerDoctor(data: DoctorDTO): Promise<void> {
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

    const existing = await this._doctorRepository.findByEmail(email);
    if (existing) throw new Error("Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);

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
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
      image: imageUrl,
      date: new Date(),
      status: "pending",
    };

    await this._doctorRepository.registerDoctor(doctorData);
  }

  async toggleAvailability(docId: string): Promise<void> {
    const doc = await this._doctorRepository.findById(docId);
    if (!doc) throw new Error("Doctor not found");

    await this._doctorRepository.updateAvailability(docId, !doc.available);
  }

  private toDoctorProfileDTO(doc: Partial<DoctorData>): DoctorProfileDTO {
    return {
      id: doc._id?.toString() ?? "",
      _id: doc._id?.toString() ?? "",
      name: doc.name ?? "",
      email: doc.email ?? "",
      image: doc.image ?? "",
      speciality: doc.speciality ?? "",
      degree: doc.degree ?? "",
      experience: doc.experience ?? "",
      about: doc.about ?? "",
      fees: doc.fees ?? 0,
      address: doc.address ?? { line1: "", line2: "" },
      available: doc.available ?? false,
      status: doc.status ?? "pending",
    };
  }

  private toDoctorListDTO(doc: Partial<DoctorData>): DoctorListDTO {
    return {
      id: doc._id?.toString() ?? "",
      _id: doc._id?.toString() ?? "",
      name: doc.name ?? "",
      image: doc.image ?? "",
      speciality: doc.speciality ?? "",
      degree: doc.degree ?? "",
      experience: doc.experience ?? "",
      fees: doc.fees ?? 0,
      available: doc.available ?? false,
      isBlocked: doc.isBlocked ?? false,
      status: doc.status ?? "pending",
    };
  }

  async getAllDoctors(): Promise<DoctorListDTO[]> {
    const list = await this._doctorRepository.findAllDoctors();
    return list.map(this.toDoctorListDTO);
  }

  async getDoctorsPaginated(page: number, limit: number, speciality?: string, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc') {
    const result = await this._doctorRepository.getDoctorsPaginated(page, limit, speciality, search, sortBy, sortOrder);
    return { ...result, data: result.data.map(this.toDoctorListDTO) };
  }

  async loginDoctor(
    email: string,
    password: string
  ): Promise<{ token: string; refreshToken: string }> {
    const doctor = await this._doctorRepository.findByEmail(email);
    if (!doctor) throw new Error("Doctor not found");

    const match = await bcrypt.compare(password, doctor.password);
    if (!match) throw new Error("Incorrect password");

    const token = generateAccessToken(doctor._id!, doctor.email, "doctor");
    const refreshToken = generateRefreshToken(doctor._id!, "doctor");

    return { token, refreshToken };
  }

  async getDoctorAppointments(docId: string): Promise<AppointmentDTO[]> {
    const doctor = await this._doctorRepository.findById(docId);
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const list = await this._doctorRepository.findAppointmentsByDoctorId(docId);
    return list.map(this.toAppointmentDTO);
  }

  async getDoctorAppointmentsPaginated(docId: string, page: number, limit: number, search?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const doctor = await this._doctorRepository.findById(docId);
    if (!doctor) {
      throw new Error("Doctor not found");
    }
    const res = await this._doctorRepository.getAppointmentsPaginated(docId, page, limit, search, sortOrder);
    return { ...res, data: res.data.map(this.toAppointmentDTO) };
  }

  async confirmAppointment(
    docId: string,
    appointmentId: string
  ): Promise<void> {
    const appointment = await this._doctorRepository.findAppointmentById(
      appointmentId
    );
    console.log(appointment?.docId);
    console.log(docId)
    if (!appointment || appointment.docId !== docId.toString()) {
      throw new Error("Mark Failed");
    }
    await this._doctorRepository.markAppointmentAsConfirmed(appointmentId);
  }

  async cancelAppointment(docId: string, appointmentId: string): Promise<void> {
    try {
      console.log(`Doctor cancelling appointment: ${appointmentId} by doctor: ${docId}`);
      const appointment = await this._doctorRepository.findPayableAppointment(
        docId,
        appointmentId
      );
      console.log(`Found appointment for doctor cancellation:`, {
        appointmentId: (appointment as any)._id?.toString() ?? "",
        userId: appointment.userId,
        docId: appointment.docId,
        payment: appointment.payment,
        amount: appointment.amount,
        status: appointment.status
      });
      
      // Process refund BEFORE cancelling the appointment
      if (appointment.payment && appointment.amount > 0) {
        console.log(`Processing refund to wallet for doctor cancellation: ${appointment.amount}`);
        // Ensure wallet exists before refunding
        await this._walletService.ensureWalletExists(appointment.userId, 'user');
        await this._walletService.processAppointmentCancellation(
          appointment.userId,
          'user',
          appointmentId,
          appointment.amount,
          'doctor'
        );
        console.log(`Refund processed successfully for doctor cancellation`);
      } else {
        console.log(`No refund needed for doctor cancellation - payment: ${appointment.payment}, amount: ${appointment.amount}`);
      }
      
      // Use SlotLockService to properly cancel appointment and release slot AFTER refund
      const result = await this._slotLockService.cancelAppointment({ appointmentId });
      console.log(`Slot lock service result:`, result);
      if (!result.success) {
        throw new Error(result.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error(`Error in doctor cancelAppointment:`, error);
      throw error;
    }
  }

  async getDoctorProfile(docId: string): Promise<DoctorProfileDTO | null> {
    const doctor = await this._doctorRepository.getDoctorProfileById(docId);
    if (!doctor) throw new Error("Doctor not found");
    return this.toDoctorProfileDTO(doctor);
  }

  async updateDoctorProfile(data: {
    doctId: string;
    name: string;
    speciality: string;
    degree: string;
    experience: string;
    about: string;
    fees: number;
    address: DoctorData["address"];
    imagePath?: string;
  }): Promise<void> {
    const doctor = await this._doctorRepository.findById(data.doctId);
    if (!doctor) throw new Error("Doctor not found");

    let imageUrl = doctor.image;

    if (data.imagePath) {
      try {
        const uploadResult = await cloudinary.uploader.upload(data.imagePath, {
          resource_type: "image",
        });
        imageUrl = uploadResult.secure_url;

        fs.unlink(data.imagePath, (err: NodeJS.ErrnoException | null) => {
          if (err) console.error("Failed to delete local file:", err);
        });
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        throw new Error("Image upload failed");
      }
    }

    await this._doctorRepository.updateDoctorProfile(data.doctId, {
      name: data.name,
      speciality: data.speciality,
      degree: data.degree,
      experience: data.experience,
      about: data.about,
      fees: data.fees,
      address: data.address,
      image: imageUrl,
    });
  }

  async getDoctorsByStatusAndLimit(status: string, limit: number): Promise<DoctorListDTO[]> {
    const docs = await this._doctorRepository.getDoctorsByStatusAndLimit(status, limit);
    return docs.map(this.toDoctorListDTO);
  }

  async getDoctorDashboard(docId: string): Promise<{
    totalAppointments: number;
    confirmedAppointments: number;
    pendingAppointments: number;
    cancelledAppointments: number;
    totalEarnings: number;
    latestAppointments: AppointmentTypes[];
    upcomingAppointments: number;
  }> {
    try {
      console.log(`Getting dashboard data for doctor: ${docId}`);
      
      
      const appointments = await this._doctorRepository.findAppointmentsByDoctorId(docId);
      console.log(`Found ${appointments.length} appointments for doctor ${docId}`);
      
      
      const totalAppointments = appointments.length;
      const confirmedAppointments = appointments.filter(apt => apt.isConfirmed && !apt.cancelled).length;
      const pendingAppointments = appointments.filter(apt => !apt.isConfirmed && !apt.cancelled).length;
      const cancelledAppointments = appointments.filter(apt => apt.cancelled).length;
      
      // Calculate total earnings (only from confirmed appointments)
      const totalEarnings = appointments
        .filter(apt => apt.isConfirmed && !apt.cancelled && apt.payment)
        .reduce((sum, apt) => sum + (apt.amount || 0), 0);
      
      // Get latest appointments (last 5)
      const latestAppointments = appointments
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      const dashboardData = {
        totalAppointments,
        confirmedAppointments,
        pendingAppointments,
        cancelledAppointments,
        totalEarnings,
        latestAppointments,
        upcomingAppointments: confirmedAppointments // For now, use confirmed as upcoming
      };
      
      console.log(`Dashboard data calculated:`, dashboardData);
      return dashboardData;
    } catch (error) {
      console.error(`Error in getDoctorDashboard:`, error);
      throw error;
    }
  }
}
