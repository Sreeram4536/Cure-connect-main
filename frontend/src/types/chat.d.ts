export interface Attachment {
  fileName: string;
  originalName: string;
  fileType: "image" | "document";
  mimeType: string;
  fileSize: number;
  filePath: string;
  uploadedAt: Date;
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
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  attachments: Attachment[];
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
  attachments?: Attachment[];
}

export interface SendMessageWithFilesRequest {
  conversationId: string;
  message?: string;
  files: File[];
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  completed: boolean;
  error?: string;
}

export interface MessageAction {
  type: "delete" | "restore" | "permanent_delete";
  messageId: string;
}

// Utility types for file handling
export interface FilePreview {
  file: File;
  id: string;
  previewUrl?: string;
  type: "image" | "document";
}

export interface UploadStatus {
  uploading: boolean;
  progress: number;
  error?: string;
} 