import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { WalletTypes, UserRole } from "../types/wallet";

interface WalletTransaction {
  _id: Types.ObjectId;
  userId: string;
  userRole: UserRole;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  appointmentId?: string;
  revenueShare?: {
    doctorAmount?: number;
    adminAmount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface WalletDocument extends WalletTypes, Document {
  _id: Types.ObjectId;
  transactions: WalletTransaction[];
}

const walletTransactionSchema = new Schema<WalletTransaction>({
  userId: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    enum: ['user', 'doctor', 'admin'],
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
  revenueShare: {
    doctorAmount: {
      type: Number,
      default: null,
    },
    adminAmount: {
      type: Number,
      default: null,
    },
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
  userRole: {
    type: String,
    enum: ['user', 'doctor', 'admin'],
    required: true,
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

// Compound index to ensure one wallet per user per role
walletSchema.index({ userId: 1, userRole: 1 }, { unique: true });

const walletModel: Model<WalletDocument> = mongoose.model<WalletDocument>(
  "wallet",
  walletSchema
);

export default walletModel; 