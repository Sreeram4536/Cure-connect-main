import { WalletTypes, WalletTransaction, CreateWalletTransactionData, UserRole } from "../../types/wallet";

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
  createWallet(userId: string, userRole: UserRole): Promise<WalletDocument>;
  getWalletByUserId(userId: string, userRole: UserRole): Promise<WalletDocument | null>;
  updateWalletBalance(userId: string, userRole: UserRole, amount: number, type: 'credit' | 'debit'): Promise<void>;
  addTransaction(transactionData: CreateWalletTransactionData): Promise<WalletTransaction>;
  getTransactionsByUserId(
    userId: string,
    userRole: UserRole,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<PaginationResult<WalletTransaction>>;
  getWalletBalance(userId: string, userRole: UserRole): Promise<number>;
  refundToWallet(userId: string, userRole: UserRole, amount: number, appointmentId: string, description: string): Promise<void>;
  deductFromWallet(userId: string, userRole: UserRole, amount: number, appointmentId: string, description: string): Promise<boolean>;
  getWalletsByRole(userRole: UserRole, page?: number, limit?: number): Promise<PaginationResult<WalletDocument>>;
} 