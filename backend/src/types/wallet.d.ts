import { Types } from "mongoose";

export type UserRole = 'user' | 'doctor' | 'admin';

export interface WalletTransaction {
  userId: string;
  userRole: UserRole;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  appointmentId?: string;
  revenueShare?: {
    doctorAmount?: number;
    adminAmount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletData {
  userId: string;
  userRole: UserRole;
  balance: number;
  transactions: WalletTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTypes {
  userId: string;
  userRole: UserRole;
  balance: number;
  transactions: WalletTransaction[];
}

export interface CreateWalletTransactionData {
  userId: string;
  userRole: UserRole;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  appointmentId?: string;
  revenueShare?: {
    doctorAmount?: number;
    adminAmount?: number;
  };
}

export interface WalletBalanceUpdate {
  userId: string;
  userRole: UserRole;
  amount: number;
  type: 'credit' | 'debit';
}

export interface RevenueShareData {
  totalAmount: number;
  doctorAmount?: number;
  adminAmount?: number;
  doctorId: string;
  appointmentId: string;
  userId?: string;
}

// DTOs for exposure
export interface WalletTransactionDTO {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  appointmentId?: string;
  revenueShare?: {
    doctorAmount?: number;
    adminAmount?: number;
  };
  createdAt: Date;
}

export interface WalletDTO {
  userId: string;
  userRole: UserRole;
  balance: number;
  transactions: WalletTransactionDTO[];
}

export interface RevenueShareDTO {
  appointmentId: string;
  totalAmount: number;
  doctorAmount: number;
  adminAmount: number;
  doctorId: string;
  createdAt: Date;
}