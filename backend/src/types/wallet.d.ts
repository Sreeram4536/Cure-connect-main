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
  balance: number;
  transactions: WalletTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTypes {
  userId: string;
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
  balance: number;
  transactions: WalletTransactionDTO[];
}