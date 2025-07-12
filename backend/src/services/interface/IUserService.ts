import { AppointmentTypes } from "../../types/appointment";
import { DoctorData } from "../../types/doctor";
import { userData } from "../../types/user";
import { PaginationResult } from "../../repositories/interface/IUserRepository";

export interface UserDocument extends userData {
  _id: string;
}

export interface IUserService {
  register(
    name: string,
    email: string,
    password: string
  ): Promise<{ token: string }>;
  login(
    email: string,
    password: string
  ): Promise<{ user: UserDocument, token: string; refreshToken: string }>;
  getProfile(userId: string): Promise<userData | null>;
  updateProfile(
    userId: string,
    data: Partial<userData>,
    imageFile?: Express.Multer.File
  ): Promise<void>;
  checkEmailExists(email: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  finalizeRegister(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserDocument>;
  resetPassword(email: string, newHashedPassword: string): Promise<boolean>;
  getUserById(id: string): Promise<UserDocument>;
  getDoctorById(id: string): Promise<DoctorData>;
  listUserAppointments(userId: string): Promise<AppointmentTypes[]>;
  listUserAppointmentsPaginated(
    userId: string,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    status?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<PaginationResult<AppointmentTypes>>;
  cancelAppointment(userId: string, appointmentId: string): Promise<void>;
  startPayment(userId: string, appointmentId: string): Promise<{ order: any }>;
  verifyPayment(
    userId: string,
    appointmentId: string,
    razorpay_order_id: string
  ): Promise<void>;
  getAvailableSlotsForDoctor(doctorId: string, year: number, month: number): Promise<any[]>;
  getAvailableSlotsForDate(doctorId: string, dateStr: string): Promise<any[]>;
  
}
