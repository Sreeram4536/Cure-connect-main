import { RevenueShareData, RevenueShareDTO } from "../../types/wallet";

export interface IRevenueShareService {
  calculateRevenueShare(totalAmount: number): { doctorAmount: number; adminAmount: number };
  processRevenueShare(revenueData: RevenueShareData): Promise<void>;
  getRevenueShareHistory(doctorId?: string, adminId?: string, page?: number, limit?: number): Promise<{ data: RevenueShareDTO[]; totalCount: number; currentPage: number; totalPages: number }>;
}
