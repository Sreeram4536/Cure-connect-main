import { WalletTransaction } from "../../types/wallet";
import { PaginationResult } from "../../repositories/interface/IWalletRepository";

export interface IWalletService {
  createWallet(userId: string): Promise<void>;
  getWalletBalance(userId: string): Promise<number>;
  getWalletTransactions(
    userId: string,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<PaginationResult<WalletTransaction>>;
  refundToWallet(userId: string, amount: number, appointmentId: string, reason: string): Promise<void>;
  deductFromWallet(userId: string, amount: number, appointmentId: string, reason: string): Promise<boolean>;
  processAppointmentCancellation(userId: string, appointmentId: string, amount: number, cancelledBy: 'user' | 'doctor' | 'admin'): Promise<void>;
  getWalletDetails(userId: string): Promise<{ balance: number; totalTransactions: number }>;
  ensureWalletExists(userId: string): Promise<void>;
} 