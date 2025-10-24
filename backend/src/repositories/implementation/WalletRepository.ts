import { BaseRepository } from "../BaseRepository";
import { IWalletRepository, WalletDocument, PaginationResult } from "../interface/IWalletRepository";
import { WalletTransaction, CreateWalletTransactionData, UserRole } from "../../types/wallet";
import walletModel from "../../models/walletModel";
import { Document } from "mongoose";

interface WalletDocumentWithId extends WalletDocument, Document {
  _id: string;
}

export class WalletRepository extends BaseRepository<WalletDocumentWithId> implements IWalletRepository {
  constructor() {
    super(walletModel as any);
  }

  async createWallet(userId: string, userRole: UserRole): Promise<WalletDocument> {
    
    const existingAny = await (this.model as any).findOne({ userId });
    if (existingAny) {
      if (!existingAny.userRole) {
        await (this.model as any).updateOne(
          { _id: existingAny._id },
          { $set: { userRole } }
        );
        const updated = await this.getWalletByUserId(userId, userRole);
        return updated as WalletDocument;
      }
      if (existingAny.userRole === userRole) {
        return existingAny as WalletDocument;
      }
      
      return existingAny as WalletDocument;
    }

    
    await (this.model as any).updateOne(
      { userId, userRole },
      { $setOnInsert: { userId, userRole, balance: 0, transactions: [] } },
      { upsert: true }
    );
    const created = await this.getWalletByUserId(userId, userRole);
    return created as WalletDocument;
  }

  async getWalletByUserId(userId: string, userRole: UserRole): Promise<WalletDocument | null> {
    return this.findOne({ userId, userRole });
  }

  async updateWalletBalance(userId: string, userRole: UserRole, amount: number, type: 'credit' | 'debit'): Promise<void> {
    console.log(`Updating wallet balance:`, { userId, userRole, amount, type });
    
    const wallet = await this.getWalletByUserId(userId, userRole);
    if (!wallet) {
      console.log(`Wallet not found for user ${userId} with role ${userRole}`);
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
    
    const wallet = await this.getWalletByUserId(transactionData.userId, transactionData.userRole);
    if (!wallet) {
      console.log(`Wallet not found for user ${transactionData.userId} with role ${transactionData.userRole}`);
      throw new Error("Wallet not found");
    }

    const transaction = {
      userId: transactionData.userId,
      userRole: transactionData.userRole,
      type: transactionData.type,
      amount: transactionData.amount,
      description: transactionData.description,
      appointmentId: transactionData.appointmentId,
      revenueShare: transactionData.revenueShare,
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

  // async getTransactionsByUserId(
  //   userId: string,
  //   userRole: UserRole,
  //   page: number,
  //   limit: number,
  //   sortBy: string = 'createdAt',
  //   sortOrder: 'asc' | 'desc' = 'desc'
  // ): Promise<PaginationResult<WalletTransaction>> {
  //   const wallet = await this.getWalletByUserId(userId, userRole);
  //   if (!wallet) {
  //     return {
  //       data: [],
  //       totalCount: 0,
  //       currentPage: page,
  //       totalPages: 0,
  //       hasNextPage: false,
  //       hasPrevPage: false
  //     };
  //   }

  //   const skip = (page - 1) * limit;
  //   const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
  //   const transactions = wallet.transactions
  //     .sort((a, b) => {
  //       if (sortBy === 'amount') {
  //         return (a.amount - b.amount) * sortDirection;
  //       }
  //       if (sortBy === 'type') {
  //         return a.type.localeCompare(b.type) * sortDirection;
  //       }
  //       return (a.createdAt.getTime() - b.createdAt.getTime()) * sortDirection;
  //     })
  //     .slice(skip, skip + limit);

  //   const totalCount = wallet.transactions.length;
  //   const totalPages = Math.ceil(totalCount / limit);

  //   return {
  //     data: transactions,
  //     totalCount,
  //     currentPage: page,
  //     totalPages,
  //     hasNextPage: page < totalPages,
  //     hasPrevPage: page > 1
  //   };
  // }

  async getTransactionsByUserId(
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
  const wallet = await this.getWalletByUserId(userId, userRole);
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

  // Apply filters
  let filtered = wallet.transactions;
  
  console.log(`[WalletRepository] Filtering transactions:`, {
    totalTransactions: wallet.transactions.length,
    type,
    startDate,
    endDate,
    sortBy,
    sortOrder
  });
  console.log(`[WalletRepository] *** DEBUG: About to check type filter. type=${type}, typeof type=${typeof type}`);

  // Universal type filtering for all roles
  console.log(`[WalletRepository] *** DEBUG: Checking if type filter should be applied. type=${type}, truthy=${!!type}`);
  
  // FORCE FILTERING FOR USER - Always apply type filter if provided
  if (type && (userRole === 'user' || type === 'credit' || type === 'debit')) {
    const beforeCount = filtered.length;
    console.log(`[WalletRepository] (ALL roles) Applying type filter: ${type}`);
    console.log(`[WalletRepository] User role: ${userRole}, Type to filter: ${type}`);
    console.log(`[WalletRepository] All transaction types before filter:`, filtered.map(tx => ({ type: tx.type, _id: (tx as any)._id })));
    
    const normalizedType = type.toLowerCase().trim();
    console.log(`[WalletRepository] Normalized filter type: "${normalizedType}"`);
    
    filtered = filtered.filter((tx) => {
      const txType = (tx.type ?? '').toLowerCase().trim();
      const matches = txType === normalizedType;
      console.log(`[WalletRepository] Transaction _id=${(tx as any)._id} type="${tx.type}" (norm="${txType}") matches "${normalizedType}": ${matches}`);
      return matches;
    });
    console.log(`[WalletRepository] (ALL roles) Type filter applied: ${beforeCount} -> ${filtered.length} transactions`);
    console.log(`[WalletRepository] Filtered transaction types:`, filtered.map(tx => ({ type: tx.type, _id: (tx as any)._id })));
  } else {
    console.log(`[WalletRepository] No type filter applied - type parameter is:`, type);
  }

  if (startDate || endDate) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(tx => {
      const txDate = new Date(tx.createdAt);
      if (startDate && endDate) {
        return txDate >= startDate && txDate <= endDate;
      } else if (startDate) {
        return txDate >= startDate;
      } else if (endDate) {
        return txDate <= endDate;
      }
      return true;
    });
    console.log(`[WalletRepository] Date filter applied: ${beforeCount} -> ${filtered.length} transactions`);
  }

  // Sorting
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    if (sortBy === 'amount') return (a.amount - b.amount) * sortDirection;
    if (sortBy === 'type') return a.type.localeCompare(b.type) * sortDirection;
    return (a.createdAt.getTime() - b.createdAt.getTime()) * sortDirection;
  });

  // Pagination
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / limit);
  const skip = (page - 1) * limit;
  const paginated = filtered.slice(skip, skip + limit);

  console.log(`[WalletRepository] FINAL RESULT - Total filtered: ${totalCount}, Paginated: ${paginated.length}`);
  console.log(`[WalletRepository] FINAL transaction types being returned:`, paginated.map(tx => ({ type: tx.type, _id: (tx as any)._id })));

  return {
    data: paginated,
    totalCount,
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}


  async getWalletBalance(userId: string, userRole: UserRole): Promise<number> {
    const wallet = await this.getWalletByUserId(userId, userRole);
    return wallet ? wallet.balance : 0;
  }

  async refundToWallet(userId: string, userRole: UserRole, amount: number, appointmentId: string, description: string): Promise<void> {
    console.log(`Repository: Refunding to wallet:`, { userId, userRole, amount, appointmentId, description });
    
    // Ensure wallet exists
    let wallet = await this.getWalletByUserId(userId, userRole);
    if (!wallet) {
      console.log(`Wallet not found for user ${userId} with role ${userRole}, creating new wallet`);
      wallet = await this.createWallet(userId, userRole);
    }

    console.log(`Wallet found/created:`, { walletId: wallet._id, currentBalance: wallet.balance });

    // First, add the transaction
    const transaction = await this.addTransaction({
      userId,
      userRole,
      type: 'credit',
      amount,
      description,
      appointmentId
    });
    console.log(`Transaction added:`, transaction);

    // Then update the balance
    await this.updateWalletBalance(userId, userRole, amount, 'credit');
    console.log(`Balance updated successfully`);
  }

  async deductFromWallet(userId: string, userRole: UserRole, amount: number, appointmentId: string, description: string): Promise<boolean> {
    
    let wallet = await this.getWalletByUserId(userId, userRole);
    if (!wallet) {
      wallet = await this.createWallet(userId, userRole);
    }

   
    if (wallet.balance < amount) {
      return false;
    }

   
    await this.addTransaction({
      userId,
      userRole,
      type: 'debit',
      amount,
      description,
      appointmentId
    });

    // Then update the balance
    await this.updateWalletBalance(userId, userRole, amount, 'debit');
    return true;
  }

  async getWalletsByRole(userRole: UserRole, page: number = 1, limit: number = 10): Promise<PaginationResult<WalletDocument>> {
    const skip = (page - 1) * limit;
    
    const wallets = await this.model.find({ userRole }).skip(skip).limit(limit).lean() as WalletDocument[];
    const totalCount = await this.model.countDocuments({ userRole });
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: wallets,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  async getWalletTransactionsByDateRange(
    userId: string, 
    userRole: UserRole, 
    startDate: Date, 
    endDate: Date, 
    transactionType?: 'credit' | 'debit'
  ): Promise<WalletTransaction[]> {
    const wallet = await this.getWalletByUserId(userId, userRole);
    if (!wallet) {
      return [];
    }

    let transactions = wallet.transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate >= startDate && txDate < endDate;
    });

    if (transactionType) {
      transactions = transactions.filter(tx => tx.type === transactionType);
    }

    return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
} 