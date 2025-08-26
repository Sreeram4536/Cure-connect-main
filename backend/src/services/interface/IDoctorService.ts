import { AppointmentDTO, AppointmentTypes } from "../../types/appointment";
import { DoctorData, DoctorProfileDTO } from "../../types/doctor";
import { PaginationResult } from "../../repositories/interface/IDoctorRepository";

export interface IDoctorService {
  registerDoctor(data: DoctorData): Promise<void>;
  toggleAvailability(docId: string): Promise<void>;
  getAllDoctors(): Promise<any[]>;
  getDoctorsPaginated(page: number, limit: number): Promise<PaginationResult<any>>;
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
}
