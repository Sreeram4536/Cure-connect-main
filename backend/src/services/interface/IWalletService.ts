import { WalletTransaction, UserRole, WalletDTO } from "../../types/wallet";
import { PaginationResult } from "../../repositories/interface/IWalletRepository";

export interface IWalletService {
  createWallet(userId: string, userRole: UserRole): Promise<void>;
  getWalletBalance(userId: string, userRole: UserRole): Promise<number>;
  getWalletTransactions(
    userId: string,
    userRole: UserRole,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    type?: 'credit' | 'debit',
    startDate?: Date,
    endDate?: Date
  ): Promise<PaginationResult<WalletTransaction>>;
  refundToWallet(userId: string, userRole: UserRole, amount: number, appointmentId: string, reason: string): Promise<void>;
  deductFromWallet(userId: string, userRole: UserRole, amount: number, appointmentId: string, reason: string): Promise<boolean>;
  processAppointmentCancellation(userId: string, userRole: UserRole, appointmentId: string, amount: number, cancelledBy: 'user' | 'doctor' | 'admin'): Promise<void>;
  getWalletDetails(userId: string, userRole: UserRole): Promise<{ balance: number; totalTransactions: number }>;
  ensureWalletExists(userId: string, userRole: UserRole): Promise<void>;
  getWalletDTO(userId: string, userRole: UserRole): Promise<WalletDTO | null>;
  getWalletsByRole(userRole: UserRole, page?: number, limit?: number): Promise<PaginationResult<WalletDTO>>;
} 