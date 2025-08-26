import { adminData, AdminDocument } from "../../types/admin";
import { AppointmentDTO, AppointmentDocument, AppointmentTypes } from "../../types/appointment";
import { DoctorData, DoctorDTO, DoctorListDTO } from "../../types/doctor";
import { UserProfileDTO } from "../../types/user";
import { PaginationResult } from "../../repositories/interface/IAdminRepository";

export interface DoctorInput extends DoctorData {
  imageFile?: Express.Multer.File;
}

export interface IAdminService {
  login(email: string, password: string): Promise<{ admin: AdminDocument, accessToken: string, refreshToken: string }>;
  getAdminById(id: string): Promise<AdminDocument | null>;
  validateCredentials(email: string, password: string): Promise<adminData>;
  addDoctor(data: DoctorDTO): Promise<string>;
  getDoctors(): Promise<DoctorListDTO[]>;
  getDoctorsPaginated(page: number, limit: number, search?: string): Promise<PaginationResult<DoctorListDTO>>;
  getUsers(search:string): Promise<UserProfileDTO[]>;
  getUsersPaginated(page: number, limit: number,search:string): Promise<PaginationResult<UserProfileDTO>>;
  toggleUserBlock(userId: string, block: boolean): Promise<string>;
  toggleDoctorBlock(doctorId: string, block: boolean): Promise<string>;
  listAppointments(): Promise<AppointmentDTO[]>;
  listAppointmentsPaginated(page: number, limit: number, search?: string): Promise<PaginationResult<AppointmentDTO>>;
  cancelAppointment(appointmentId: string): Promise<void>;
  approveDoctor(doctorId: string): Promise<string>;
  rejectDoctor(doctorId: string): Promise<string>;
}
