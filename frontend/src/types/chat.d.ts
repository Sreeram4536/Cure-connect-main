export interface FileAttachment {
  url: string;
  publicId: string;
  originalName: string;
  fileType: string;
  fileSize: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: "user" | "doctor";
  message: string;
  messageType: "text" | "image" | "file" | "mixed";
  timestamp: Date;
  isRead: boolean;
  attachments?: FileAttachment[];
}

export interface Conversation {
  id: string;
  userId: string;
  doctorId: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatListResponse {
  conversations: Conversation[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface MessageListResponse {
  messages: ChatMessage[];
  totalCount: number;
  page: number;
  limit: number;
  conversationId: string;
}

export interface SendMessageRequest {
  conversationId: string;
  message: string;
  messageType?: "text" | "image" | "file" | "mixed";
  attachments?: FileAttachment[];
}

export interface SendMessageWithFilesRequest {
  conversationId: string;
  message?: string;
  files?: FileList;
} 