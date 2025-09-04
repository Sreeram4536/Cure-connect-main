import { WalletTypes, WalletTransaction, CreateWalletTransactionData } from "../../types/wallet";

export interface WalletDocument extends WalletTypes {
  _id: string;
}

export interface PaginationResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IWalletRepository {
  // Existing methods (backward compatibility)
  createWallet(userId: string): Promise<WalletDocument>;
  getWalletByUserId(userId: string): Promise<WalletDocument | null>;
  updateWalletBalance(userId: string, amount: number, type: 'credit' | 'debit'): Promise<void>;
  addTransaction(transactionData: CreateWalletTransactionData): Promise<WalletTransaction>;
  getTransactionsByUserId(
    userId: string,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<PaginationResult<WalletTransaction>>;
  getWalletBalance(userId: string): Promise<number>;
  refundToWallet(userId: string, amount: number, appointmentId: string, description: string): Promise<void>;
  deductFromWallet(userId: string, amount: number, appointmentId: string, description: string): Promise<boolean>;
  
  // Extended methods for multi-user-type support
  createWalletByType(userId: string, userType: 'user' | 'doctor' | 'admin'): Promise<WalletDocument>;
  getWalletByUserIdAndType(userId: string, userType: 'user' | 'doctor' | 'admin'): Promise<WalletDocument | null>;
  updateWalletBalanceByType(userId: string, userType: 'user' | 'doctor' | 'admin', amount: number, type: 'credit' | 'debit'): Promise<void>;
  addTransactionByType(transactionData: CreateWalletTransactionData, userType: 'user' | 'doctor' | 'admin'): Promise<WalletTransaction>;
  getTransactionsByUserIdAndType(
    userId: string,
    userType: 'user' | 'doctor' | 'admin',
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<PaginationResult<WalletTransaction>>;
  getWalletBalanceByType(userId: string, userType: 'user' | 'doctor' | 'admin'): Promise<number>;
} 