import { RevenueDistributionData, RevenueDistributionResult } from "../../types/wallet";

/**
 * Interface for revenue distribution service following SOLID principles
 * Handles revenue sharing between doctors and admin
 */
export interface IRevenueDistributionService {
  /**
   * Distributes revenue from appointment payment
   * @param distributionData - Revenue distribution data including doctor and amount details
   * @returns Promise<RevenueDistributionResult> - Result of the distribution operation
   */
  distributeRevenue(distributionData: RevenueDistributionData): Promise<RevenueDistributionResult>;
  
  /**
   * Calculates revenue shares based on total amount
   * @param totalAmount - Total appointment amount
   * @returns Object containing doctor share (80%) and admin share (20%)
   */
  calculateRevenueShares(totalAmount: number): { doctorShare: number; adminShare: number };
}