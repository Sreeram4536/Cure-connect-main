/**
 * Revenue sharing configuration constants
 * Following SOLID principles - Open/Closed principle for easy modification
 */
export const REVENUE_SHARING = {
  DOCTOR_SHARE_PERCENTAGE: 0.8,  // 80%
  ADMIN_SHARE_PERCENTAGE: 0.2,   // 20%
  SYSTEM_ADMIN_ID: (typeof process !== 'undefined' && process.env?.SYSTEM_ADMIN_ID) || 'system_admin'
} as const;

/**
 * Revenue sharing calculation utilities
 */
export class RevenueCalculator {
  static calculateShares(totalAmount: number): { doctorShare: number; adminShare: number } {
    const doctorShare = Math.round(totalAmount * REVENUE_SHARING.DOCTOR_SHARE_PERCENTAGE * 100) / 100;
    const adminShare = Math.round(totalAmount * REVENUE_SHARING.ADMIN_SHARE_PERCENTAGE * 100) / 100;
    
    return { doctorShare, adminShare };
  }
}