export type UserRole = 'user' | 'doctor' | 'admin';

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
