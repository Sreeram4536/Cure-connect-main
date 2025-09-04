import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { WalletTypes } from "../types/wallet";

interface WalletTransaction {
  _id: Types.ObjectId;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  appointmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WalletDocument extends WalletTypes, Document {
  _id: Types.ObjectId;
  userType: 'user' | 'doctor' | 'admin';
  transactions: WalletTransaction[];
}

const walletTransactionSchema = new Schema<WalletTransaction>({
  userId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  appointmentId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const walletSchema: Schema<WalletDocument> = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    enum: ['user', 'doctor', 'admin'],
    required: true,
    default: 'user'
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  transactions: [walletTransactionSchema],
}, {
  timestamps: true,
});

// Create compound index for userId and userType to ensure unique wallets per user type
walletSchema.index({ userId: 1, userType: 1 }, { unique: true });

const walletModel: Model<WalletDocument> = mongoose.model<WalletDocument>(
  "wallet",
  walletSchema
);

export default walletModel; 