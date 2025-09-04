import { AppointmentDTO, AppointmentTypes } from "../../types/appointment";
import { DoctorData, DoctorListDTO, DoctorProfileDTO } from "../../types/doctor";
import { PaginationResult } from "../../repositories/interface/IDoctorRepository";
import { WalletTransaction } from "../../types/wallet";
import { PaginationResult as WalletPaginationResult } from "../../repositories/interface/IWalletRepository";

export interface IDoctorService {
  getDoctorsByStatusAndLimit(status: string, limit: number): Promise<DoctorListDTO[]>;
  getDoctorDashboard(docId: string): Promise<{
    totalAppointments: number;
    confirmedAppointments: number;
    pendingAppointments: number;
    cancelledAppointments: number;
    totalEarnings: number;
  }>;
  registerDoctor(data: DoctorData): Promise<void>;
  toggleAvailability(docId: string): Promise<void>;
  getAllDoctors(): Promise<DoctorListDTO[]>;
  getDoctorsPaginated(page: number, limit: number,speciality?: string, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<PaginationResult<DoctorListDTO>>;
  loginDoctor(
    email: string,
    password: string
  ): Promise<{ token: string; refreshToken: string }>;
  getDoctorAppointments(docId: string): Promise<AppointmentDTO[]>;
  getDoctorAppointmentsPaginated(docId: string, page: number, limit: number, search?: string): Promise<PaginationResult<AppointmentDTO>>;
  confirmAppointment(docId: string, appointmentId: string): Promise<void>;
  cancelAppointment(docId: string, appointmentId: string): Promise<void>;
  getDoctorProfile(docId: string): Promise<DoctorProfileDTO | null>;
  updateDoctorProfile(data: {
    doctId: string;
    name: string;
    speciality: string;
    degree: string;
    experience: string;
    about: string;
    fees: number;
    address: DoctorData["address"];
    imagePath?: string;
  }): Promise<void>;

  // Doctor Wallet Methods
  getDoctorWalletDetails(doctorId: string): Promise<{ balance: number; totalTransactions: number }>;
  getDoctorWalletTransactions(
    doctorId: string,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<WalletPaginationResult<WalletTransaction>>;
  getDoctorWalletBalance(doctorId: string): Promise<number>;
}
