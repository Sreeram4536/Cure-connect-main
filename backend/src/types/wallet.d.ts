import { Types } from "mongoose";

export interface WalletTransaction {
  _id: Types.ObjectId;
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