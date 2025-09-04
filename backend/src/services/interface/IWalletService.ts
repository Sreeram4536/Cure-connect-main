import { WalletTransaction } from "../../types/wallet";
import { PaginationResult } from "../../repositories/interface/IWalletRepository";

export interface IWalletService {
  // Existing user wallet methods (backward compatibility)
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
  
  // Extended methods for multi-user-type support
  createWalletByType(userId: string, userType: 'user' | 'doctor' | 'admin'): Promise<void>;
  getWalletBalanceByType(userId: string, userType: 'user' | 'doctor' | 'admin'): Promise<number>;
  getWalletTransactionsByType(
    userId: string,
    userType: 'user' | 'doctor' | 'admin',
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<PaginationResult<WalletTransaction>>;
  getWalletDetailsByType(userId: string, userType: 'user' | 'doctor' | 'admin'): Promise<{ balance: number; totalTransactions: number }>;
  ensureWalletExists(userId: string, userType?: 'user' | 'doctor' | 'admin'): Promise<void>;
  creditWallet(userId: string, userType: 'user' | 'doctor' | 'admin', amount: number, appointmentId: string, description: string): Promise<void>;
  debitWallet(userId: string, userType: 'user' | 'doctor' | 'admin', amount: number, appointmentId: string, description: string): Promise<boolean>;
} 