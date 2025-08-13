import mongoose, { Document, Schema } from "mongoose";

export interface IChatMessage extends Document {
  _id: string;
  conversationId: string;
  senderId: string;
  senderType: "user" | "doctor";
  message: string;
  messageType: "text" | "image" | "file";
  timestamp: Date;
  isRead: boolean;
  attachments?: string[];
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface IConversation extends Document {
  _id: string;
  userId: string;
  doctorId: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  senderType: {
    type: String,
    enum: ["user", "doctor"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  messageType: {
    type: String,
    enum: ["text", "image", "file"],
    default: "text",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  attachments: [{
    type: String,
  }],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: String,
  },
}, {
  timestamps: false, // Disable timestamps for messages
});

const conversationSchema = new Schema<IConversation>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  doctorId: {
    type: String,
    required: true,
    index: true,
  },
  lastMessage: {
    type: String,
  },
  lastMessageTime: {
    type: Date,
  },
  unreadCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Compound index for efficient querying
conversationSchema.index({ userId: 1, doctorId: 1 }, { unique: true, sparse: true });

export const ChatMessage = mongoose.model<IChatMessage>("ChatMessage", chatMessageSchema);
export const Conversation = mongoose.model<IConversation>("Conversation", conversationSchema); 