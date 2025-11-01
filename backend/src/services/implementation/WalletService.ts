import { IWalletService } from "../interface/IWalletService";
import { WalletRepository } from "../../repositories/implementation/WalletRepository";
import { WalletTransaction, WalletDTO, WalletTransactionDTO, UserRole } from "../../types/wallet";
import { IWalletRepository, PaginationResult, WalletDocument } from "../../repositories/interface/IWalletRepository";
import { toWalletDTO } from "../../mapper/wallet.mapper";


interface TransactionWithId extends WalletTransaction {
  _id?: string;
}

export class WalletService implements IWalletService {
 
  
  constructor(private _walletRepository: IWalletRepository) {
    
  }

  async createWallet(userId: string, userRole: UserRole): Promise<void> {
    try {
      const existingWallet = await this._walletRepository.getWalletByUserId(userId, userRole);
      if (!existingWallet) {
        await this._walletRepository.createWallet(userId, userRole);
      }
    } catch (error) {
      // Handle duplicate key error gracefully
      if (error instanceof Error && error.message.includes('E11000')) {
        console.log(`Wallet already exists for user ${userId} with role ${userRole}`);
        return; // Wallet already exists, no need to create
      }
      throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWalletBalance(userId: string, userRole: UserRole): Promise<number> {
    try {
      return await this._walletRepository.getWalletBalance(userId, userRole);
    } catch (error) {
      throw new Error(`Failed to get wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWalletTransactions(
    userId: string,
    userRole: UserRole,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    type?: 'credit' | 'debit',
    startDate?: Date,
    endDate?: Date
  ): Promise<PaginationResult<WalletTransaction>> {
    try {
      console.log(`[WalletService] getWalletTransactions called with:`, {
        userId,
        userRole,
        page,
        limit,
        sortBy,
        sortOrder,
        type,
        startDate,
        endDate
      });
      
      return await this._walletRepository.getTransactionsByUserId(
        userId,
        userRole,
        page,
        limit,
        sortBy,
        sortOrder,
        type,
        startDate,
        endDate
      );

    } catch (error) {
      throw new Error(`Failed to get wallet transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundToWallet(userId: string, userRole: UserRole, amount: number, appointmentId: string, description: string): Promise<void> {
    console.log(`[WalletService] refundToWallet called`, { userId, userRole, amount, appointmentId, description });
    let wallet = await this._walletRepository.getWalletByUserId(userId, userRole);
    if (!wallet) {
      console.log(`[WalletService] No wallet found for user ${userId} with role ${userRole}, creating wallet...`);
      wallet = await this._walletRepository.createWallet(userId, userRole);
    }
    console.log(`[WalletService] Wallet found/created:`, { walletId: wallet._id, currentBalance: wallet.balance });
    const transaction = await this._walletRepository.addTransaction({ userId, userRole, type: 'credit', amount, description, appointmentId });
    console.log(`[WalletService] Transaction added:`, transaction);
    await this._walletRepository.updateWalletBalance(userId, userRole, amount, 'credit');
    console.log(`[WalletService] Balance updated successfully`);
  }

  async deductFromWallet(userId: string, userRole: UserRole, amount: number, appointmentId: string, reason: string): Promise<boolean> {
    try {
      const description = `Payment for appointment - ${reason}`;
      return await this._walletRepository.deductFromWallet(userId, userRole, amount, appointmentId, description);
    } catch (error) {
      throw new Error(`Failed to deduct from wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processAppointmentCancellation(userId: string, userRole: UserRole, appointmentId: string, amount: number, cancelledBy: 'user' | 'doctor' | 'admin'): Promise<void> {
    console.log(`[WalletService] processAppointmentCancellation called`, { userId, userRole, appointmentId, amount, cancelledBy });
    try {
      const reason = `Cancelled by ${cancelledBy}`;
      await this.refundToWallet(userId, userRole, amount, appointmentId, reason);
      console.log(`[WalletService] Refund to wallet completed successfully`);
    } catch (error) {
      console.error(`[WalletService] Failed to process appointment cancellation:`, error);
      throw new Error(`Failed to process appointment cancellation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWalletDetails(userId: string, userRole: UserRole): Promise<{ balance: number; totalTransactions: number }> {
    try {
      const wallet = await this._walletRepository.getWalletByUserId(userId, userRole);
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

  public async ensureWalletExists(userId: string, userRole: UserRole): Promise<void> {
    try {
      let wallet = await this._walletRepository.getWalletByUserId(userId, userRole);
      if (!wallet) {
        await this._walletRepository.createWallet(userId, userRole);
      }
    } catch (error) {
      // Handle duplicate key error gracefully
      if (error instanceof Error && error.message.includes('E11000')) {
        console.log(`Wallet already exists for user ${userId} with role ${userRole}`);
        return; // Wallet already exists, no need to create
      }
      throw error; // Re-throw other errors
    }
  }

  async getWalletDTO(userId: string, userRole: UserRole): Promise<WalletDTO | null> {
    try {
      const wallet = await this._walletRepository.getWalletByUserId(userId, userRole);
      return wallet ? toWalletDTO(wallet) : null;
    } catch (error) {
      throw new Error(`Failed to get wallet DTO: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWalletsByRole(userRole: UserRole, page: number = 1, limit: number = 10): Promise<PaginationResult<WalletDTO>> {
    try {
      const result = await this._walletRepository.getWalletsByRole(userRole, page, limit);
      return {
        ...result,
        data: result.data.map(toWalletDTO)
      };
    } catch (error) {
      throw new Error(`Failed to get wallets by role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 

