export interface FileAttachment {
  url: string;
  publicId: string;
  originalName: string;
  fileType: string;
  fileSize: number;
}

export interface ChatMessageDTO {
  conversationId: string;
  senderId: string;
  senderType: "user" | "doctor";
  message: string;
  messageType: "text" | "image" | "file" | "mixed";
  attachments?: FileAttachment[];
}

export interface ConversationDTO {
  userId: string;
  doctorId: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isActive: boolean;
}

export interface ChatMessageResponse {
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

export interface ConversationResponse {
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
  conversations: ConversationResponse[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface MessageListResponse {
  messages: ChatMessageResponse[];
  totalCount: number;
  page: number;
  limit: number;
  conversationId: string;
} 