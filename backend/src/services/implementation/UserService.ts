import { IUserService } from "../interface/IUserService";
import { IUserRepository, PaginationResult } from "../../repositories/interface/IUserRepository";
import { userData, UserAuthDTO, UserProfileDTO } from "../../types/user";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import { AppointmentTypes, AppointmentDTO, AppointmentDocument, WalletPaymentData, WalletPaymentResponse } from "../../types/appointment";
import { isValidDateOfBirth, isValidPhone } from "../../utils/validator";
import { DoctorData } from "../../types/doctor";
import { PaymentService } from "./PaymentService";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.utils";
import { DoctorSlotService } from "./SlotService";
import { SlotRepository } from "../../repositories/implementation/SlotRepository";
import { ISlotLockService } from "../interface/ISlotLockService";
import { WalletService } from "./WalletService";
import { WalletTransaction } from "../../types/wallet";
import { WalletPaymentService } from "./WalletPaymentService";
import { RevenueShareService } from "./RevenueShareService";
import { HttpResponse } from "../../constants/responseMessage.constants";
import { SlotRuleRepository } from "../../repositories/implementation/SlotRuleRepository";
import { IWalletPaymentService } from "../interface/IWalletPaymentService";
import { IPaymentService } from "../interface/IPaymentService";
import { IWalletService } from "../interface/IWalletService";
import { WalletRepository } from "../../repositories/implementation/WalletRepository";
import { LeaveManagementService } from "./LeaveManagementService";
import { Orders } from "razorpay/dist/types/orders";
import { LeaveManagementRepository } from "../../repositories/implementation/LeaveManagementRepository";

// Extended type for appointments that includes _id from MongoDB documents
type AppointmentWithId = AppointmentTypes & { _id?: string };

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

export interface UserDocument extends userData {
  _id: string;
}

const slotRepository = new SlotRepository();
const walletRepository = new WalletRepository();
const leaveManagementRepository = new LeaveManagementRepository();
const walletService = new WalletService(walletRepository);
const leaveManagementService = new LeaveManagementService(walletService,leaveManagementRepository)
const slotRuleRepository = new SlotRuleRepository(leaveManagementService)
const slotService = new DoctorSlotService(slotRepository,slotRuleRepository);

export class UserService implements IUserService {
  
  constructor(
    private _walletPaymentService: IWalletPaymentService,
    private _userRepository: IUserRepository,
    private _paymentService :IPaymentService,
    private _slotLockService: ISlotLockService,
    private _walletService : IWalletService
  ) {
    
  }

   

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

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<{ token: string; refreshToken: string }> {
    if (!name || !email || !password) throw new Error("Missing Details");
    if (!validator.isEmail(email)) throw new Error("Invalid email");
    if (password.length < 8) throw new Error("Password too short");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = (await this._userRepository.create({
      name,
      email,
      password: hashedPassword,
    })) as UserDocument;

    // Create wallet for new user
    await this._walletService.createWallet(user._id, 'user');

    const token = generateAccessToken(user._id, user.email, "user");
    const refreshToken = generateRefreshToken(user._id, "user");

    return { token, refreshToken };
  }

  private toUserAuthDTO(user: userData & { _id: string }): UserAuthDTO {
    return {
      id: user._id?.toString() ?? "",
      name: user.name,
      email: user.email,
      image: user.image,
      isBlocked: !!user.isBlocked,
    };
  }

  private toUserProfileDTO(user: userData & { _id: string; createdAt?: Date; updatedAt?: Date }): UserProfileDTO {
    return {
      id: user._id?.toString() ?? "",
      name: user.name,
      email: user.email,
      image: user.image,
      address: user.address,
      gender: user.gender,
      dob: user.dob,
      phone: user.phone,
      isBlocked: !!user.isBlocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: UserAuthDTO, token: string; refreshToken: string }> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) throw new Error("User not found");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");
    if (user.isBlocked)
      throw new Error("Your account has been blocked by admin");

    // Ensure wallet exists for user
    await this._walletService.createWallet(user._id, 'user');

    const token = generateAccessToken(user._id, user.email, "user");
    const refreshToken = generateRefreshToken(user._id, "user");

    return { user: this.toUserAuthDTO(user), token, refreshToken };
  }

  async getProfile(userId: string): Promise<UserProfileDTO | null> {
    const user = await this._userRepository.findById(userId);
    return user ? this.toUserProfileDTO(user) : null;
  }

  async updateProfile(
    userId: string,
    data: Partial<userData>,
    imageFile?: Express.Multer.File
  ): Promise<void> {
    if (
      !data.name ||
      !data.phone ||
      !data.address ||
      !data.dob ||
      !data.gender
    ) {
      throw new Error("Please provide all details");
    }

    if (!isValidPhone(data.phone)) {
      throw new Error("Phone number must be 10 numbers");
    }

    if (!isValidDateOfBirth(data.dob)) {
      throw new Error("Enter a valid birth date");
    }

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      data.image = imageUpload.secure_url;
    }

    await this._userRepository.updateById(userId, data);
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this._userRepository.findByEmail(email);
    return !!user;
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async finalizeRegister(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserDocument> {
    const user = (await this._userRepository.create(userData)) as UserDocument;
    
    // Create wallet for new user
    await this._walletService.createWallet(user._id, 'user');
    
    return user;
  }

  async resetPassword(
    email: string,
    newHashedPassword: string
  ): Promise<boolean> {
    return await this._userRepository.updatePasswordByEmail(
      email,
      newHashedPassword
    );
  }

  async getUserById(id: string): Promise<UserDocument> {
    const user = await this._userRepository.findById(id);
    if (!user) throw new Error("User not found");
    return user as UserDocument;
  }

  async getDoctorById(id: string): Promise<DoctorData> {
    const doctor = await this._userRepository.findDoctorById(id);
    if (!doctor) throw new Error("Doctor not found");
    return doctor;
  }

  async listUserAppointments(userId: string): Promise<AppointmentDTO[]> {
    const list = await this._userRepository.getAppointmentsByUserId(userId);
    return list.map(this.toAppointmentDTO);
  }

  async listUserAppointmentsPaginated(
    userId: string,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    status?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<PaginationResult<AppointmentDTO>> {
    const res = await this._userRepository.getAppointmentsByUserIdPaginated(
      userId,
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      dateFrom,
      dateTo
    );
    return { ...res, data: res.data.map(this.toAppointmentDTO) } as PaginationResult<AppointmentDTO>;
  }

  async cancelAppointment(
    userId: string,
    appointmentId: string
  ): Promise<void> {
    try {
      console.log(`Attempting to cancel appointment: ${appointmentId} for user: ${userId}`);
      
      // Get appointment details to check if payment was made
      const appointment = await this._userRepository.findPayableAppointment(userId, appointmentId);
      console.log(`Found appointment:`, { 
        appointmentId: appointment._id, 
        payment: appointment.payment, 
        amount: appointment.amount,
        status: appointment.status 
      });
      
      // Process refund BEFORE cancelling the appointment
      if (appointment.payment && appointment.amount > 0) {
        console.log(`Processing refund with revenue reversal: ${appointment.amount}`);
        const walletRepository = new WalletRepository();
        const adminRepository = require("../../repositories/implementation/AdminRepository").default;
        const adminRepo = new adminRepository();
        const revenueShare = new RevenueShareService(this._walletService, walletRepository, adminRepo);
        await revenueShare.reverseRevenueShare({
          totalAmount: appointment.amount,
          doctorId: String(appointment.docId),
          userId,
          appointmentId
        });
        console.log(`Refund processed successfully`);
      } else {
        console.log(`No refund needed - payment: ${appointment.payment}, amount: ${appointment.amount}`);
      }
      
      // Use the existing slot lock service to cancel the appointment and release the slot AFTER refund
      const result = await this._slotLockService.cancelAppointment({ appointmentId });
      console.log(`Slot lock service result:`, result);
      
      if (!result.success) {
        throw new Error(result.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error(`Error in cancelAppointment:`, error);
      throw error;
    }
  }

  async startPayment(
    userId: string,
    appointmentId: string
  ): Promise<{ order: Orders.RazorpayOrder }> {
    const appointment = await this._userRepository.findPayableAppointment(
      userId,
      appointmentId
    );

    console.log("Appointment:", appointment);
    console.log("Amount:", appointment.amount);
    console.log("hii");

    const order = await this._paymentService.createOrder(
      appointment.amount * 100,
      appointment._id.toString()
    );

    return { order };
  }

  async verifyPayment(
    userId: string,
    appointmentId: string,
    razorpay_order_id: string
  ): Promise<void> {
    const appointment = await this._userRepository.findPayableAppointment(userId, appointmentId);

    const orderInfo = await this._paymentService.fetchOrder(razorpay_order_id);

    if (orderInfo.status !== "paid") {
      throw new Error("Payment not completed");
    }

    if (orderInfo.receipt !== appointmentId) {
      throw new Error("Receipt / appointment mismatch");
    }

    await this._userRepository.markAppointmentPaid(appointmentId);

    // Revenue share after successful Razorpay payment
    try {
      const amount = appointment.amount;
      const docId = String(appointment.docId);
      // Ensure doctor/admin wallets exist and credit shares via WalletPaymentService pattern
      const walletRepository = new WalletRepository();
      const adminRepository = require("../../repositories/implementation/AdminRepository").default;
      const adminRepo = new adminRepository();
      const revenueShare = new RevenueShareService(this._walletService, walletRepository, adminRepo);
      await revenueShare.processRevenueShare({
        totalAmount: amount,
        doctorAmount: 0,
        adminAmount: 0,
        doctorId: docId,
        appointmentId
      });
    } catch (err) {
      console.error('Revenue share after Razorpay verify failed:', err);
    }
  }

  async getAvailableSlotsForDoctor(doctorId: string, year: number, month: number): Promise<TimeSlot[]> {
   
    return slotService.getMonthlySlots(doctorId, year, month);
  }

  async getAvailableSlotsForDate(doctorId: string, dateStr: string): Promise<TimeSlot[]> {
    return slotService.getSlotsForDate(doctorId, dateStr);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    // Find user by ID
    const user = await this._userRepository.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }
    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return { success: false, message: 'Current password is incorrect.' };
    }
    // Validate new password (already done in controller, but double check if needed)
    if (currentPassword === newPassword) {
      return { success: false, message: 'New password must be different from current password.' };
    }
    // Hash new password
    const hashed = await this.hashPassword(newPassword);
    await this._userRepository.updateById(userId, { password: hashed });
    return { success: true };
  }

  async getWalletBalance(userId: string): Promise<number> {
    return await this._walletService.getWalletBalance(userId, 'user');
  }

  async getWalletTransactions(
    userId: string,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginationResult<WalletTransaction>> {
    return await this._walletService.getWalletTransactions(userId, 'user', page, limit, sortBy, sortOrder);
  }

  async getWalletDetails(userId: string): Promise<{ balance: number; totalTransactions: number }> {
    return await this._walletService.getWalletDetails(userId, 'user');
  }

  async processWalletPayment(paymentData: WalletPaymentData): Promise<WalletPaymentResponse> {
    return await this._walletPaymentService.processWalletPayment(paymentData);
  }

  async finalizeWalletPayment(appointmentId: string, userId: string, amount: number): Promise<WalletPaymentResponse> {
    return await this._walletPaymentService.finalizeWalletPayment(appointmentId, userId, amount);
  }

  async validateWalletBalance(userId: string, amount: number): Promise<boolean> {
    return await this._walletPaymentService.validateWalletBalance(userId, amount);
  }
}
