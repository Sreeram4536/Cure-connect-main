export interface Attachment {
  type: 'image' | 'file' | 'video' | 'audio' | 'url';
  asset_url?: string;
  image_url?: string;
  file_url?: string;
  thumb_url?: string;
  title?: string;
  name?: string;
  size?: number;
  mime_type?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: "user" | "doctor";
  message: string;
  messageType: "text" | "image" | "file";
  timestamp: Date;
  isRead: boolean;
  attachments?: string[] | Attachment[];
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
  messageType?: "text" | "image" | "file";
  attachments?: string[] | Attachment[];
} 