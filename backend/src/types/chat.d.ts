export interface AttachmentDTO {
  fileName: string;
  originalName: string;
  fileType: "image" | "document";
  mimeType: string;
  fileSize: number;
  filePath: string;
  uploadedAt?: Date;
}

export interface ChatMessageDTO {
  conversationId: string;
  senderId: string;
  senderType: "user" | "doctor";
  message: string;
  messageType: "text" | "image" | "file" | "mixed";
  attachments: AttachmentDTO[];
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
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  attachments: AttachmentDTO[];
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

// Lightweight info objects returned alongside conversations
export interface DoctorInfoDTO {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  specialization: string;
  lastSeen: string;
}

export interface UserInfoDTO {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface FileUploadRequest {
  conversationId: string;
  message?: string;
  files: Express.Multer.File[];
}

export interface DeleteMessageRequest {
  messageId: string;
  userId: string;

} 