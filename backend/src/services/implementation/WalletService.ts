import { IWalletService } from "../interface/IWalletService";
import { WalletRepository } from "../../repositories/implementation/WalletRepository";
import { WalletTransaction, WalletDTO, WalletTransactionDTO } from "../../types/wallet";
import { IWalletRepository, PaginationResult, WalletDocument } from "../../repositories/interface/IWalletRepository";

// Extended type for transactions that includes an id field
interface TransactionWithId extends WalletTransaction {
  _id?: string;
}

export class WalletService implements IWalletService {
  private toWalletTransactionDTO(tx: TransactionWithId): WalletTransactionDTO {
    return {
      id: tx._id?.toString() ?? "",
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      appointmentId: tx.appointmentId,
      createdAt: tx.createdAt,
    };
  }

  private toWalletDTO(wallet: WalletDocument): WalletDTO {
    return {
      userId: wallet.userId,
      userType: wallet.userType || 'user',
      balance: wallet.balance,
      transactions: (wallet.transactions || []).map(this.toWalletTransactionDTO),
    };
  }
  
  constructor(private walletRepository: IWalletRepository) {
    
  }

  async createWallet(userId: string): Promise<void> {
    try {
      const existingWallet = await this.walletRepository.getWalletByUserIdAndType(userId, 'user');
      if (!existingWallet) {
        await this.walletRepository.createWalletByType(userId, 'user');
      }
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWalletBalance(userId: string): Promise<number> {
    try {
      return await this.walletRepository.getWalletBalanceByType(userId, 'user');
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
      return await this.walletRepository.getTransactionsByUserIdAndType(userId, 'user', page, limit, sortBy, sortOrder);
    } catch (error) {
      throw new Error(`Failed to get wallet transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundToWallet(userId: string, amount: number, appointmentId: string, description: string): Promise<void> {
    console.log(`[WalletService] refundToWallet called`, { userId, amount, appointmentId, description });
    let wallet = await this.walletRepository.getWalletByUserIdAndType(userId, 'user');
    if (!wallet) {
      console.log(`[WalletService] No wallet found for user ${userId}, creating wallet...`);
      wallet = await this.walletRepository.createWalletByType(userId, 'user');
    }
    console.log(`[WalletService] Wallet found/created:`, { walletId: wallet._id, currentBalance: wallet.balance });
    const transaction = await this.walletRepository.addTransactionByType({ userId, type: 'credit', amount, description, appointmentId }, 'user');
    console.log(`[WalletService] Transaction added:`, transaction);
    await this.walletRepository.updateWalletBalanceByType(userId, 'user', amount, 'credit');
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
      const wallet = await this.walletRepository.getWalletByUserIdAndType(userId, 'user');
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

  public async ensureWalletExists(userId: string, userType: 'user' | 'doctor' | 'admin' = 'user'): Promise<void> {
    let wallet = await this.walletRepository.getWalletByUserIdAndType(userId, userType);
    if (!wallet) {
      await this.walletRepository.createWalletByType(userId, userType);
    }
  }

  // Extended methods for multi-user-type support
  async createWalletByType(userId: string, userType: 'user' | 'doctor' | 'admin'): Promise<void> {
    try {
      const existingWallet = await this.walletRepository.getWalletByUserIdAndType(userId, userType);
      if (!existingWallet) {
        await this.walletRepository.createWalletByType(userId, userType);
      }
    } catch (error) {
      throw new Error(`Failed to create ${userType} wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWalletBalanceByType(userId: string, userType: 'user' | 'doctor' | 'admin'): Promise<number> {
    try {
      return await this.walletRepository.getWalletBalanceByType(userId, userType);
    } catch (error) {
      throw new Error(`Failed to get ${userType} wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWalletTransactionsByType(
    userId: string,
    userType: 'user' | 'doctor' | 'admin',
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginationResult<WalletTransaction>> {
    try {
      return await this.walletRepository.getTransactionsByUserIdAndType(userId, userType, page, limit, sortBy, sortOrder);
    } catch (error) {
      throw new Error(`Failed to get ${userType} wallet transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWalletDetailsByType(userId: string, userType: 'user' | 'doctor' | 'admin'): Promise<{ balance: number; totalTransactions: number }> {
    try {
      const wallet = await this.walletRepository.getWalletByUserIdAndType(userId, userType);
      if (!wallet) {
        return { balance: 0, totalTransactions: 0 };
      }
      
      return {
        balance: wallet.balance,
        totalTransactions: wallet.transactions.length
      };
    } catch (error) {
      throw new Error(`Failed to get ${userType} wallet details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async creditWallet(userId: string, userType: 'user' | 'doctor' | 'admin', amount: number, appointmentId: string, description: string): Promise<void> {
    console.log(`[WalletService] creditWallet called for ${userType}`, { userId, amount, appointmentId, description });
    
    let wallet = await this.walletRepository.getWalletByUserIdAndType(userId, userType);
    if (!wallet) {
      console.log(`[WalletService] No ${userType} wallet found for user ${userId}, creating wallet...`);
      wallet = await this.walletRepository.createWalletByType(userId, userType);
    }
    
    console.log(`[WalletService] ${userType} wallet found/created:`, { walletId: wallet._id, currentBalance: wallet.balance });
    
    const transaction = await this.walletRepository.addTransactionByType({ 
      userId, 
      type: 'credit', 
      amount, 
      description, 
      appointmentId 
    }, userType);
    
    console.log(`[WalletService] Transaction added to ${userType} wallet:`, transaction);
    
    await this.walletRepository.updateWalletBalanceByType(userId, userType, amount, 'credit');
    console.log(`[WalletService] ${userType} wallet balance updated successfully`);
  }

  async debitWallet(userId: string, userType: 'user' | 'doctor' | 'admin', amount: number, appointmentId: string, description: string): Promise<boolean> {
    try {
      console.log(`[WalletService] debitWallet called for ${userType}`, { userId, amount, appointmentId, description });
      
      // Ensure wallet exists
      let wallet = await this.walletRepository.getWalletByUserIdAndType(userId, userType);
      if (!wallet) {
        wallet = await this.walletRepository.createWalletByType(userId, userType);
      }

      // Check if user has sufficient balance
      if (wallet.balance < amount) {
        console.log(`[WalletService] Insufficient balance in ${userType} wallet: ${wallet.balance} < ${amount}`);
        return false;
      }

      // First, add the transaction
      await this.walletRepository.addTransactionByType({
        userId,
        type: 'debit',
        amount,
        description,
        appointmentId
      }, userType);

      // Then update the balance
      await this.walletRepository.updateWalletBalanceByType(userId, userType, amount, 'debit');
      console.log(`[WalletService] ${userType} wallet debited successfully`);
      return true;
    } catch (error) {
      console.error(`[WalletService] Failed to debit ${userType} wallet:`, error);
      throw new Error(`Failed to debit ${userType} wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 