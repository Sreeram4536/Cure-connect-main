import { BaseRepository } from "../BaseRepository";
import { IWalletRepository, WalletDocument, PaginationResult } from "../interface/IWalletRepository";
import { WalletTransaction, CreateWalletTransactionData } from "../../types/wallet";
import walletModel from "../../models/walletModel";
import { Document } from "mongoose";

interface WalletDocumentWithId extends WalletDocument, Document {
  _id: string;
}

export class WalletRepository extends BaseRepository<WalletDocumentWithId> implements IWalletRepository {
  constructor() {
    super(walletModel as any);
  }

  async createWallet(userId: string): Promise<WalletDocument> {
    const walletData = {
      userId,
      userType: 'user' as const,
      balance: 0,
      transactions: []
    };
    return this.create(walletData);
  }

  async createWalletByType(userId: string, userType: 'user' | 'doctor' | 'admin'): Promise<WalletDocument> {
    const walletData = {
      userId,
      userType,
      balance: 0,
      transactions: []
    };
    return this.create(walletData);
  }

  async getWalletByUserId(userId: string): Promise<WalletDocument | null> {
    return this.findOne({ userId, userType: 'user' });
  }

  async getWalletByUserIdAndType(userId: string, userType: 'user' | 'doctor' | 'admin'): Promise<WalletDocument | null> {
    return this.findOne({ userId, userType });
  }

  async updateWalletBalance(userId: string, amount: number, type: 'credit' | 'debit'): Promise<void> {
    return this.updateWalletBalanceByType(userId, 'user', amount, type);
  }

  async addTransaction(transactionData: CreateWalletTransactionData): Promise<WalletTransaction> {
    return this.addTransactionByType(transactionData, 'user');
  }

  async getTransactionsByUserId(
    userId: string,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginationResult<WalletTransaction>> {
    return this.getTransactionsByUserIdAndType(userId, 'user', page, limit, sortBy, sortOrder);
  }

  async getWalletBalance(userId: string): Promise<number> {
    const wallet = await this.getWalletByUserIdAndType(userId, 'user');
    return wallet ? wallet.balance : 0;
  }

  async refundToWallet(userId: string, amount: number, appointmentId: string, description: string): Promise<void> {
    console.log(`Repository: Refunding to wallet:`, { userId, amount, appointmentId, description });
    
    // Ensure wallet exists
    let wallet = await this.getWalletByUserIdAndType(userId, 'user');
    if (!wallet) {
      console.log(`Wallet not found for user ${userId}, creating new wallet`);
      wallet = await this.createWalletByType(userId, 'user');
    }

    console.log(`Wallet found/created:`, { walletId: wallet._id, currentBalance: wallet.balance });

    // First, add the transaction
    const transaction = await this.addTransactionByType({
      userId,
      type: 'credit',
      amount,
      description,
      appointmentId
    }, 'user');
    console.log(`Transaction added:`, transaction);

    // Then update the balance
    await this.updateWalletBalanceByType(userId, 'user', amount, 'credit');
    console.log(`Balance updated successfully`);
  }

  async deductFromWallet(userId: string, amount: number, appointmentId: string, description: string): Promise<boolean> {
    // Ensure wallet exists
    let wallet = await this.getWalletByUserIdAndType(userId, 'user');
    if (!wallet) {
      wallet = await this.createWalletByType(userId, 'user');
    }

    // Check if user has sufficient balance
    if (wallet.balance < amount) {
      return false;
    }

    // First, add the transaction
    await this.addTransactionByType({
      userId,
      type: 'debit',
      amount,
      description,
      appointmentId
    }, 'user');

    // Then update the balance
    await this.updateWalletBalanceByType(userId, 'user', amount, 'debit');
    return true;
  }

  // Extended methods for multi-user-type support
  async updateWalletBalanceByType(userId: string, userType: 'user' | 'doctor' | 'admin', amount: number, type: 'credit' | 'debit'): Promise<void> {
    console.log(`Updating wallet balance by type:`, { userId, userType, amount, type });
    
    const wallet = await this.getWalletByUserIdAndType(userId, userType);
    if (!wallet) {
      console.log(`Wallet not found for user ${userId} with type ${userType}`);
      throw new Error("Wallet not found");
    }

    const newBalance = type === 'credit' 
      ? wallet.balance + amount 
      : wallet.balance - amount;

    console.log(`Balance calculation:`, { 
      currentBalance: wallet.balance, 
      amount, 
      type, 
      newBalance 
    });

    if (newBalance < 0) {
      console.log(`Insufficient balance: ${newBalance}`);
      throw new Error("Insufficient balance");
    }

    await this.updateById(wallet._id, { balance: newBalance });
    console.log(`Balance updated successfully for ${userType} wallet`);
  }

  async addTransactionByType(transactionData: CreateWalletTransactionData, userType: 'user' | 'doctor' | 'admin'): Promise<WalletTransaction> {
    console.log(`Adding transaction by type:`, { transactionData, userType });
    
    const wallet = await this.getWalletByUserIdAndType(transactionData.userId, userType);
    if (!wallet) {
      throw new Error(`Wallet not found for user ${transactionData.userId} with type ${userType}`);
    }

    const transaction = {
      userId: transactionData.userId,
      type: transactionData.type,
      amount: transactionData.amount,
      description: transactionData.description,
      appointmentId: transactionData.appointmentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.updateById(wallet._id, {
      $push: { transactions: transaction }
    });

    console.log(`Transaction added successfully to ${userType} wallet:`, transaction);
    return transaction;
  }

  async getTransactionsByUserIdAndType(
    userId: string,
    userType: 'user' | 'doctor' | 'admin',
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginationResult<WalletTransaction>> {
    const wallet = await this.getWalletByUserIdAndType(userId, userType);
    if (!wallet) {
      return {
        data: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }

    const transactions = wallet.transactions || [];
    const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
    
    transactions.sort((a, b) => {
      if (sortBy === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * sortMultiplier;
      }
      if (sortBy === 'amount') {
        return (a.amount - b.amount) * sortMultiplier;
      }
      return 0;
    });

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    const totalCount = transactions.length;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: paginatedTransactions,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async getWalletBalanceByType(userId: string, userType: 'user' | 'doctor' | 'admin'): Promise<number> {
    const wallet = await this.getWalletByUserIdAndType(userId, userType);
    return wallet ? wallet.balance : 0;
  }
} 