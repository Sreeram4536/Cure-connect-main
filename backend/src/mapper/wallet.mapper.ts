import { WalletDTO, WalletTransactionDTO } from "../dto/wallet.dto";
import { WalletDocument } from "../repositories/interface/IWalletRepository";
import { WalletTransaction } from "../types/wallet";
interface TransactionWithId extends WalletTransaction {
  _id?: string;
}

 export const toWalletTransactionDTO=(tx: TransactionWithId): WalletTransactionDTO=> {
    return {
      id: tx._id?.toString() ?? "",
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      appointmentId: tx.appointmentId,
      revenueShare: tx.revenueShare,
      createdAt: tx.createdAt,
    };
  }

  export const toWalletDTO=(wallet: WalletDocument): WalletDTO => {
    return {
      userId: wallet.userId,
      userRole: wallet.userRole,
      balance: wallet.balance,
      transactions: (wallet.transactions || []).map(toWalletTransactionDTO),
    };
  }