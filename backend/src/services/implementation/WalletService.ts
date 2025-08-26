import { IWalletService } from "../interface/IWalletService";
import { WalletRepository } from "../../repositories/implementation/WalletRepository";
import { WalletTransaction, WalletDTO, WalletTransactionDTO } from "../../types/wallet";
import { PaginationResult } from "../../repositories/interface/IWalletRepository";

export class WalletService implements IWalletService {
  private toWalletTransactionDTO(tx: any): WalletTransactionDTO {
    return {
      id: tx._id?.toString?.() ?? String(tx._id ?? ''),
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      appointmentId: tx.appointmentId,
      createdAt: tx.createdAt,
    };
  }

  private toWalletDTO(wallet: any): WalletDTO {
    return {
      userId: wallet.userId,
      balance: wallet.balance,
      transactions: (wallet.transactions || []).map(this.toWalletTransactionDTO),
    };
  }
  private walletRepository: WalletRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
  }

  async createWallet(userId: string): Promise<void> {
    try {
      const existingWallet = await this.walletRepository.getWalletByUserId(userId);
      if (!existingWallet) {
        await this.walletRepository.createWallet(userId);
      }
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWalletBalance(userId: string): Promise<number> {
    try {
      return await this.walletRepository.getWalletBalance(userId);
    } catch (error) {
      throw new Error(`Failed to get wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWalletTransactions(
    userId: string,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginationResult<WalletTransaction>> {
    try {
      return await this.walletRepository.getTransactionsByUserId(userId, page, limit, sortBy, sortOrder);
    } catch (error) {
      throw new Error(`Failed to get wallet transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundToWallet(userId: string, amount: number, appointmentId: string, description: string): Promise<void> {
    console.log(`[WalletService] refundToWallet called`, { userId, amount, appointmentId, description });
    let wallet = await this.walletRepository.getWalletByUserId(userId);
    if (!wallet) {
      console.log(`[WalletService] No wallet found for user ${userId}, creating wallet...`);
      wallet = await this.walletRepository.createWallet(userId);
    }
    console.log(`[WalletService] Wallet found/created:`, { walletId: wallet._id, currentBalance: wallet.balance });
    const transaction = await this.walletRepository.addTransaction({ userId, type: 'credit', amount, description, appointmentId });
    console.log(`[WalletService] Transaction added:`, transaction);
    await this.walletRepository.updateWalletBalance(userId, amount, 'credit');
    console.log(`[WalletService] Balance updated successfully`);
  }

  async deductFromWallet(userId: string, amount: number, appointmentId: string, reason: string): Promise<boolean> {
    try {
      const description = `Payment for appointment - ${reason}`;
      return await this.walletRepository.deductFromWallet(userId, amount, appointmentId, description);
    } catch (error) {
      throw new Error(`Failed to deduct from wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processAppointmentCancellation(userId: string, appointmentId: string, amount: number, cancelledBy: 'user' | 'doctor' | 'admin'): Promise<void> {
    console.log(`[WalletService] processAppointmentCancellation called`, { userId, appointmentId, amount, cancelledBy });
    try {
      const reason = `Cancelled by ${cancelledBy}`;
      await this.refundToWallet(userId, amount, appointmentId, reason);
      console.log(`[WalletService] Refund to wallet completed successfully`);
    } catch (error) {
      console.error(`[WalletService] Failed to process appointment cancellation:`, error);
      throw new Error(`Failed to process appointment cancellation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWalletDetails(userId: string): Promise<{ balance: number; totalTransactions: number }> {
    try {
      const wallet = await this.walletRepository.getWalletByUserId(userId);
      if (!wallet) {
        return { balance: 0, totalTransactions: 0 };
      }
      
      return {
        balance: wallet.balance,
        totalTransactions: wallet.transactions.length
      };
    } catch (error) {
      throw new Error(`Failed to get wallet details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async ensureWalletExists(userId: string): Promise<void> {
    let wallet = await this.walletRepository.getWalletByUserId(userId);
    if (!wallet) {
      await this.walletRepository.createWallet(userId);
    }
  }
} 