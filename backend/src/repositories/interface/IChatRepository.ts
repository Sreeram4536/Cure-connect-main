import { ChatMessageDTO, ConversationDTO, ChatMessageResponse, ConversationResponse, ChatListResponse, MessageListResponse } from "../../types/chat";

export interface IChatRepository {
  // Conversation methods
  createConversation(conversationData: ConversationDTO): Promise<ConversationResponse>;
  getConversation(userId: string, doctorId: string): Promise<ConversationResponse | null>;
  getConversationById(conversationId: string): Promise<ConversationResponse | null>;
  getUserConversations(userId: string, page: number, limit: number): Promise<ChatListResponse>;
  getDoctorConversations(doctorId: string, page: number, limit: number): Promise<ChatListResponse>;
  updateConversation(conversationId: string, updateData: Partial<ConversationDTO>): Promise<ConversationResponse | null>;
  deleteConversation(conversationId: string): Promise<boolean>;

  // Message methods
  createMessage(messageData: ChatMessageDTO): Promise<ChatMessageResponse>;
  getMessages(conversationId: string, page: number, limit: number): Promise<MessageListResponse>;
  getMessageById(messageId: string): Promise<ChatMessageResponse | null>;
  markMessageAsRead(messageId: string): Promise<boolean>;
  markConversationAsRead(conversationId: string, userId: string): Promise<boolean>;
  getUnreadCount(conversationId: string, userId: string): Promise<number>;
  deleteMessage(messageId: string): Promise<boolean>;
  softDeleteMessage(messageId: string): Promise<boolean>;
} 