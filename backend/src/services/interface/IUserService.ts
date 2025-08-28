import { AppointmentDTO, AppointmentTypes } from "../../types/appointment";
import { DoctorData } from "../../types/doctor";
import { userData, UserProfileDTO, UserAuthDTO } from "../../types/user";
import { PaginationResult } from "../../repositories/interface/IUserRepository";
import { WalletTransaction } from "../../types/wallet";
import { WalletPaymentData, WalletPaymentResponse } from "../../types/appointment";
import { Orders } from "razorpay/dist/types/orders";

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
  ): Promise<{ user: UserAuthDTO, token: string; refreshToken: string }>;
  getProfile(userId: string): Promise<UserProfileDTO | null>;
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
  listUserAppointments(userId: string): Promise<AppointmentDTO[]>;
  listUserAppointmentsPaginated(
    userId: string,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    status?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<PaginationResult<AppointmentDTO>>;
  cancelAppointment(userId: string, appointmentId: string): Promise<void>;
  startPayment(userId: string, appointmentId: string): Promise<{ order: Orders.RazorpayOrder }>;
  verifyPayment(
    userId: string,
    appointmentId: string,
    razorpay_order_id: string
  ): Promise<void>;
  getAvailableSlotsForDoctor(doctorId: string, year: number, month: number): Promise<TimeSlot[]>;
  getAvailableSlotsForDate(doctorId: string, dateStr: string): Promise<TimeSlot[]>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }>;
  getWalletBalance(userId: string): Promise<number>;
  getWalletTransactions(
    userId: string,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<PaginationResult<WalletTransaction>>;
  getWalletDetails(userId: string): Promise<{ balance: number; totalTransactions: number }>;
  processWalletPayment(paymentData: WalletPaymentData): Promise<WalletPaymentResponse>;
  finalizeWalletPayment(appointmentId: string, userId: string, amount: number): Promise<WalletPaymentResponse>;
  validateWalletBalance(userId: string, amount: number): Promise<boolean>;
}

// Define proper types for slots
interface TimeSlot {
  date: string;
  start: string;
  end: string;
  baseDuration?: number;
  customDuration?: number;
  isBooked: boolean;
  isPast: boolean;
}
