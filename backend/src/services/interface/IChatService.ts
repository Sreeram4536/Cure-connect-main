import { ChatMessageDTO, ConversationDTO, ChatMessageResponse, ConversationResponse, ChatListResponse, MessageListResponse, AttachmentDTO, DoctorInfoDTO, UserInfoDTO } from "../../types/chat";

export interface IChatService {
  // Conversation methods
  createConversation(userId: string, doctorId: string): Promise<ConversationResponse>;
  getConversation(userId: string, doctorId: string): Promise<ConversationResponse | null>;
  getConversationById(conversationId: string): Promise<ConversationResponse | null>;
  getUserConversations(userId: string, page: number, limit: number): Promise<ChatListResponse>;
  getDoctorConversations(doctorId: string, page: number, limit: number): Promise<ChatListResponse>;
  deleteConversation(conversationId: string, userId: string): Promise<boolean>;
  getDoctorInfo(doctorId: string): Promise<DoctorInfoDTO>;
  getUserInfo(userId: string): Promise<UserInfoDTO>;

  // Message methods
  sendMessage(messageData: ChatMessageDTO, senderId: string): Promise<ChatMessageResponse>;
  sendMessageWithFiles(
    conversationId: string, 
    senderId: string, 
    senderType: "user" | "doctor",
    message: string,
    files: Express.Multer.File[]
  ): Promise<ChatMessageResponse>;
  getMessages(conversationId: string, page: number, limit: number): Promise<MessageListResponse>;
  markConversationAsRead(conversationId: string, userId: string): Promise<boolean>;
  getUnreadCount(conversationId: string, userId: string): Promise<number>;
  deleteMessage(messageId: string, senderId: string): Promise<boolean>;
  softDeleteMessage(messageId: string, senderId: string): Promise<boolean>;
  // Minimal file utility used by upload-only endpoints
  processUploadedFiles(files: Express.Multer.File[]): Promise<AttachmentDTO[]>;
} 