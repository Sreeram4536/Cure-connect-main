import { Types } from "mongoose";

export interface WalletTransaction {
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  appointmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletData {
  userId: string;
  userType: 'user' | 'doctor' | 'admin';
  balance: number;
  transactions: WalletTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTypes {
  userId: string;
  userType: 'user' | 'doctor' | 'admin';
  balance: number;
  transactions: WalletTransaction[];
}

export interface CreateWalletTransactionData {
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  appointmentId?: string;
}

export interface WalletBalanceUpdate {
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
} 

// DTOs for exposure
export interface WalletTransactionDTO {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  appointmentId?: string;
  createdAt: Date;
}

export interface WalletDTO {
  userId: string;
  userType: 'user' | 'doctor' | 'admin';
  balance: number;
  transactions: WalletTransactionDTO[];
}

// Revenue sharing types
export interface RevenueDistributionData {
  appointmentId: string;
  doctorId: string;
  totalAmount: number;
  doctorShare: number; // 80%
  adminShare: number;  // 20%
  description: string;
}

export interface RevenueDistributionResult {
  success: boolean;
  doctorTransactionId?: string;
  adminTransactionId?: string;
  message: string;
}

export interface CreateWalletData {
  userId: string;
  userType: 'user' | 'doctor' | 'admin';
}