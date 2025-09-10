import { IRevenueShareService } from "../interface/IRevenueShareService";
import { RevenueShareData, RevenueShareDTO } from "../../types/wallet";
import { IWalletService } from "../interface/IWalletService";
import { IWalletRepository } from "../../repositories/interface/IWalletRepository";

export class RevenueShareService implements IRevenueShareService {
  private readonly DOCTOR_PERCENTAGE = 0.8; // 80%
  private readonly ADMIN_PERCENTAGE = 0.2; // 20%

  constructor(
    private walletService: IWalletService,
    private walletRepository: IWalletRepository
  ) {}

  calculateRevenueShare(totalAmount: number): { doctorAmount: number; adminAmount: number } {
    const doctorAmount = Math.round(totalAmount * this.DOCTOR_PERCENTAGE * 100) / 100;
    const adminAmount = Math.round((totalAmount - doctorAmount) * 100) / 100;
    
    return { doctorAmount, adminAmount };
  }

  async processRevenueShare(revenueData: RevenueShareData): Promise<void> {
    try {
      const { totalAmount, doctorId, appointmentId } = revenueData;
      const { doctorAmount, adminAmount } = this.calculateRevenueShare(totalAmount);

      // Ensure doctor wallet exists
      await this.walletService.ensureWalletExists(doctorId, 'doctor');
      
      // Ensure admin wallet exists (using a system admin ID)
      const adminId = process.env.ADMIN_WALLET_ID || 'default-admin';
      await this.walletService.ensureWalletExists(adminId, 'admin');

      // Add credit transaction to doctor wallet
      await this.walletRepository.addTransaction({
        userId: doctorId,
        userRole: 'doctor',
        type: 'credit',
        amount: doctorAmount,
        description: `Revenue share from appointment ${appointmentId}`,
        appointmentId,
        revenueShare: {
          doctorAmount,
          adminAmount
        }
      });

      // Add credit transaction to admin wallet
      await this.walletRepository.addTransaction({
        userId: adminId,
        userRole: 'admin',
        type: 'credit',
        amount: adminAmount,
        description: `Revenue share from appointment ${appointmentId}`,
        appointmentId,
        revenueShare: {
          doctorAmount,
          adminAmount
        }
      });

      // Update balances
      await this.walletRepository.updateWalletBalance(doctorId, 'doctor', doctorAmount, 'credit');
      await this.walletRepository.updateWalletBalance(adminId, 'admin', adminAmount, 'credit');

    } catch (error) {
      console.error('Error processing revenue share:', error);
      throw new Error(`Failed to process revenue share: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async reverseRevenueShare(revenueData: { totalAmount: number; doctorId: string; userId: string; appointmentId: string }): Promise<void> {
    try {
      const { totalAmount, doctorId, userId, appointmentId } = revenueData;
      const { doctorAmount, adminAmount } = this.calculateRevenueShare(totalAmount);

      const adminId = process.env.ADMIN_WALLET_ID || 'default-admin';

      // Ensure wallets exist
      await this.walletService.ensureWalletExists(doctorId, 'doctor');
      await this.walletService.ensureWalletExists(adminId, 'admin');
      await this.walletService.ensureWalletExists(userId, 'user');

      // Debit doctor (80%)
      await this.walletRepository.addTransaction({
        userId: doctorId,
        userRole: 'doctor',
        type: 'debit',
        amount: doctorAmount,
        description: `Refund for cancellation ${appointmentId}`,
        appointmentId,
        revenueShare: { doctorAmount, adminAmount }
      });
      await this.walletRepository.updateWalletBalance(doctorId, 'doctor', doctorAmount, 'debit');

      // Debit admin (20%)
      await this.walletRepository.addTransaction({
        userId: adminId,
        userRole: 'admin',
        type: 'debit',
        amount: adminAmount,
        description: `Refund for cancellation ${appointmentId}`,
        appointmentId,
        revenueShare: { doctorAmount, adminAmount }
      });
      await this.walletRepository.updateWalletBalance(adminId, 'admin', adminAmount, 'debit');

      // Credit user (100%)
      await this.walletRepository.addTransaction({
        userId,
        userRole: 'user',
        type: 'credit',
        amount: totalAmount,
        description: `Refund for cancellation ${appointmentId}`,
        appointmentId
      });
      await this.walletRepository.updateWalletBalance(userId, 'user', totalAmount, 'credit');
    } catch (error) {
      console.error('Error reversing revenue share:', error);
      throw new Error(`Failed to reverse revenue share: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRevenueShareHistory(
    doctorId?: string, 
    adminId?: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{ data: RevenueShareDTO[]; totalCount: number; currentPage: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      
      // Build query based on provided IDs
      const query: any = {
        'transactions.revenueShare': { $exists: true, $ne: null }
      };

      if (doctorId) {
        query.userId = doctorId;
        query.userRole = 'doctor';
      } else if (adminId) {
        query.userId = adminId;
        query.userRole = 'admin';
      }

      // This would need to be implemented in the repository
      // For now, returning empty result
      return {
        data: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0
      };
    } catch (error) {
      console.error('Error getting revenue share history:', error);
      throw new Error(`Failed to get revenue share history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
