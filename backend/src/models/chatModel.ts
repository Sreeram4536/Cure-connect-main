import mongoose, { Document, Schema } from "mongoose";

export interface IAttachment {
  fileName: string;
  originalName: string;
  fileType: "image" | "document";
  mimeType: string;
  fileSize: number;
  filePath: string;
  uploadedAt: Date;
}

export interface IChatMessage extends Document {
  _id: string;
  conversationId: string;
  senderId: string;
  senderType: "user" | "doctor";
  message: string;
  messageType: "text" | "image" | "file" | "mixed";
  timestamp: Date;
  isRead: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  attachments: IAttachment[];
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

const attachmentSchema = new Schema<IAttachment>({
  fileName: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ["image", "document"],
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

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
    required: function(this: IChatMessage) {
      return this.messageType === "text" || this.attachments.length === 0;
    },
  },
  messageType: {
    type: String,
    enum: ["text", "image", "file", "mixed"],
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
  attachments: [attachmentSchema],
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