import { IWalletPaymentService } from "../interface/IWalletPaymentService";
import { WalletPaymentData, WalletPaymentResponse } from "../../types/appointment";
import { WalletService } from "./WalletService";
import { AppointmentRepository } from "../../repositories/implementation/AppointmentRepository";
import { DoctorRepository } from "../../repositories/implementation/DoctorRepository";
import { UserRepository } from "../../repositories/implementation/UserRepository";
import { HttpResponse } from "../../constants/responseMessage.constants";
import { HttpStatus } from "../../constants/status.constants";
import { IWalletService } from "../interface/IWalletService";
import { IAppointmentRepository } from "../../repositories/interface/IAppointmentRepository";
import { IDoctorRepository } from "../../repositories/interface/IDoctorRepository";
import { IRevenueShareService } from "../interface/IRevenueShareService";
import { RevenueShareService } from "./RevenueShareService";
import { WalletRepository } from "../../repositories/implementation/WalletRepository";
import { AdminRepository } from "../../repositories/implementation/AdminRepository";

export class WalletPaymentService implements IWalletPaymentService {
  private revenueShareService: IRevenueShareService;
  
  constructor( 
    private walletService: IWalletService,
    private appointmentRepository: IAppointmentRepository,
    ) {
    const walletRepository = new WalletRepository();
    // const adminRepository = require("../../repositories/implementation/AdminRepository").default;
    const adminRepo = new AdminRepository();
    this.revenueShareService = new RevenueShareService(walletService, walletRepository, adminRepo);
  }

  async validateWalletBalance(userId: string, amount: number): Promise<boolean> {
    try {
      const balance = await this.walletService.getWalletBalance(userId, 'user');
      return balance >= amount;
    } catch (error) {
      console.error("Error validating wallet balance:", error);
      return false;
    }
  }

  async processWalletPayment(paymentData: WalletPaymentData): Promise<WalletPaymentResponse> {
    try {
      const { userId, docId, slotDate, slotTime, amount, appointmentId } = paymentData;

      // Validate wallet balance
      const hasSufficientBalance = await this.validateWalletBalance(userId, amount);
      if (!hasSufficientBalance) {
        return {
          success: false,
          message: HttpResponse.WALLET_INSUFFICIENT_BALANCE
        };
      }

      // Get appointment details
      const appointment = await this.appointmentRepository.findById(appointmentId);
      if (!appointment) {
        return {
          success: false,
          message: HttpResponse.APPOINTMENT_NOT_FOUND
        };
      }

      // Ensure wallet exists
      await this.walletService.ensureWalletExists(userId, 'user');

      // Deduct amount from wallet
      const deductionSuccess = await this.walletService.deductFromWallet(
        userId,
        'user',
        amount,
        appointmentId,
        `Appointment payment for ${slotDate} at ${slotTime}`
      );

      if (!deductionSuccess) {
        return {
          success: false,
          message: HttpResponse.WALLET_PAYMENT_FAILED
        };
      }

      // Process revenue sharing (80% to doctor, 20% to admin)
      await this.revenueShareService.processRevenueShare({
        totalAmount: amount,
        doctorAmount: 0, // Will be calculated by the service
        adminAmount: 0, // Will be calculated by the service
        doctorId: docId,
        appointmentId
      });

      // Update appointment with wallet payment details
      await this.appointmentRepository.updateAppointment(appointmentId, {
        payment: true,
        status: 'confirmed',
        paymentMethod: 'wallet',
        lockExpiresAt: undefined,
        date: new Date()
      });

      return {
        success: true,
        message: HttpResponse.WALLET_PAYMENT_SUCCESS,
        appointmentId,
        transactionId: appointmentId // Using appointmentId as transaction reference
      };

    } catch (error) {
      console.error("Error processing wallet payment:", error);
      return {
        success: false,
        message: HttpResponse.WALLET_PAYMENT_FAILED
      };
    }
  }

  async finalizeWalletPayment(appointmentId: string, userId: string, amount: number): Promise<WalletPaymentResponse> {
    try {
      // Get appointment details
      const appointment = await this.appointmentRepository.findById(appointmentId);
      if (!appointment) {
        return {
          success: false,
          message: HttpResponse.APPOINTMENT_NOT_FOUND
        };
      }

      // Validate that this appointment belongs to the user
      if (appointment.userId !== userId) {
        return {
          success: false,
          message: HttpResponse.FORBIDDEN
        };
      }

      // Validate wallet balance
      const hasSufficientBalance = await this.validateWalletBalance(userId, amount);
      if (!hasSufficientBalance) {
        return {
          success: false,
          message: HttpResponse.WALLET_INSUFFICIENT_BALANCE
        };
      }

      // Ensure wallet exists
      await this.walletService.ensureWalletExists(userId, 'user');

      // Deduct amount from wallet
      const deductionSuccess = await this.walletService.deductFromWallet(
        userId,
        'user',
        amount,
        appointmentId,
        `Appointment payment for ${appointment.slotDate} at ${appointment.slotTime}`
      );

      if (!deductionSuccess) {
        return {
          success: false,
          message: HttpResponse.WALLET_PAYMENT_FAILED
        };
      }

      // Process revenue sharing (80% to doctor, 20% to admin)
      await this.revenueShareService.processRevenueShare({
        totalAmount: amount,
        doctorAmount: 0, // Will be calculated by the service
        adminAmount: 0, // Will be calculated by the service
        doctorId: appointment.docId,
        appointmentId
      });

      // Update appointment with wallet payment details
      await this.appointmentRepository.updateAppointment(appointmentId, {
        payment: true,
        status: 'confirmed',
        paymentMethod: 'wallet',
        lockExpiresAt: undefined,
        date: new Date()
      });

      return {
        success: true,
        message: HttpResponse.WALLET_PAYMENT_SUCCESS,
        appointmentId,
        transactionId: appointmentId
      };

    } catch (error) {
      console.error("Error finalizing wallet payment:", error);
      return {
        success: false,
        message: HttpResponse.WALLET_PAYMENT_FAILED
      };
    }
  }
} 