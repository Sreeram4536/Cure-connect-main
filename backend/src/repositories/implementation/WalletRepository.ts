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
      balance: 0,
      transactions: []
    };
    return this.create(walletData);
  }

  async getWalletByUserId(userId: string): Promise<WalletDocument | null> {
    return this.findOne({ userId });
  }

  async updateWalletBalance(userId: string, amount: number, type: 'credit' | 'debit'): Promise<void> {
    console.log(`Updating wallet balance:`, { userId, amount, type });
    
    const wallet = await this.getWalletByUserId(userId);
    if (!wallet) {
      console.log(`Wallet not found for user ${userId}`);
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

    await this.updateById(wallet._id.toString(), { balance: newBalance });
    console.log(`Wallet balance updated successfully to: ${newBalance}`);
  }

  async addTransaction(transactionData: CreateWalletTransactionData): Promise<WalletTransaction> {
    console.log(`Adding transaction:`, transactionData);
    
    const wallet = await this.getWalletByUserId(transactionData.userId);
    if (!wallet) {
      console.log(`Wallet not found for user ${transactionData.userId}`);
      throw new Error("Wallet not found");
    }

    const transaction = {
      userId: transactionData.userId,
      type: transactionData.type,
      amount: transactionData.amount,
      description: transactionData.description,
      appointmentId: transactionData.appointmentId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log(`Transaction object created:`, transaction);

    await this.updateById(wallet._id.toString(), {
      $push: { transactions: transaction }
    });

    console.log(`Transaction added to wallet successfully`);
    return transaction as WalletTransaction;
  }

  async getTransactionsByUserId(
    userId: string,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginationResult<WalletTransaction>> {
    const wallet = await this.getWalletByUserId(userId);
    if (!wallet) {
      return {
        data: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      };
    }

    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    const transactions = wallet.transactions
      .sort((a, b) => {
        if (sortBy === 'amount') {
          return (a.amount - b.amount) * sortDirection;
        }
        if (sortBy === 'type') {
          return a.type.localeCompare(b.type) * sortDirection;
        }
        return (a.createdAt.getTime() - b.createdAt.getTime()) * sortDirection;
      })
      .slice(skip, skip + limit);

    const totalCount = wallet.transactions.length;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: transactions,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  async getWalletBalance(userId: string): Promise<number> {
    const wallet = await this.getWalletByUserId(userId);
    return wallet ? wallet.balance : 0;
  }

  async refundToWallet(userId: string, amount: number, appointmentId: string, description: string): Promise<void> {
    console.log(`Repository: Refunding to wallet:`, { userId, amount, appointmentId, description });
    
    // Ensure wallet exists
    let wallet = await this.getWalletByUserId(userId);
    if (!wallet) {
      console.log(`Wallet not found for user ${userId}, creating new wallet`);
      wallet = await this.createWallet(userId);
    }

    console.log(`Wallet found/created:`, { walletId: wallet._id, currentBalance: wallet.balance });

    // First, add the transaction
    const transaction = await this.addTransaction({
      userId,
      type: 'credit',
      amount,
      description,
      appointmentId
    });
    console.log(`Transaction added:`, transaction);

    // Then update the balance
    await this.updateWalletBalance(userId, amount, 'credit');
    console.log(`Balance updated successfully`);
  }

  async deductFromWallet(userId: string, amount: number, appointmentId: string, description: string): Promise<boolean> {
    // Ensure wallet exists
    let wallet = await this.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await this.createWallet(userId);
    }

    // Check if user has sufficient balance
    if (wallet.balance < amount) {
      return false;
    }

    // First, add the transaction
    await this.addTransaction({
      userId,
      type: 'debit',
      amount,
      description,
      appointmentId
    });

    // Then update the balance
    await this.updateWalletBalance(userId, amount, 'debit');
    return true;
  }
} 