import { IRevenueDistributionService } from "../interface/IRevenueDistributionService";
import { IWalletService } from "../interface/IWalletService";
import { RevenueDistributionData, RevenueDistributionResult } from "../../types/wallet";
import { REVENUE_SHARING, RevenueCalculator } from "../../constants/revenue.constants";

/**
 * Revenue Distribution Service implementing SOLID principles
 * Single Responsibility: Handles only revenue distribution logic
 * Open/Closed: Extensible for different revenue sharing models
 * Dependency Inversion: Depends on abstractions (IWalletService)
 */
export class RevenueDistributionService implements IRevenueDistributionService {
  constructor(private walletService: IWalletService) {}

  /**
   * Calculates revenue shares based on total amount
   * @param totalAmount - Total appointment amount
   * @returns Object containing doctor share (80%) and admin share (20%)
   */
  calculateRevenueShares(totalAmount: number): { doctorShare: number; adminShare: number } {
    return RevenueCalculator.calculateShares(totalAmount);
  }

  /**
   * Distributes revenue from appointment payment to doctor and admin wallets
   * @param distributionData - Revenue distribution data
   * @returns Promise<RevenueDistributionResult> - Result of the distribution operation
   */
  async distributeRevenue(distributionData: RevenueDistributionData): Promise<RevenueDistributionResult> {
    try {
      const { appointmentId, doctorId, totalAmount, description } = distributionData;
      
      // Calculate shares
      const { doctorShare, adminShare } = this.calculateRevenueShares(totalAmount);
      
      // Ensure doctor wallet exists
      await this.walletService.ensureWalletExists(doctorId, 'doctor');
      
      // Find admin user ID (using a system admin ID)
      const adminId = REVENUE_SHARING.SYSTEM_ADMIN_ID;
      await this.walletService.ensureWalletExists(adminId, 'admin');

      // Credit doctor wallet (80%)
      await this.walletService.creditWallet(
        doctorId,
        'doctor',
        doctorShare,
        appointmentId,
        `${description} - Doctor share (80%)`
      );

      // Credit admin wallet (20%)
      await this.walletService.creditWallet(
        adminId,
        'admin',
        adminShare,
        appointmentId,
        `${description} - Platform commission (20%)`
      );

      return {
        success: true,
        doctorTransactionId: appointmentId,
        adminTransactionId: appointmentId,
        message: `Revenue distributed successfully: ₹${doctorShare} to doctor, ₹${adminShare} to admin`
      };

    } catch (error) {
      console.error('Error distributing revenue:', error);
      return {
        success: false,
        message: `Failed to distribute revenue: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}