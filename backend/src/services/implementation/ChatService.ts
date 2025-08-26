import { IChatService } from "../interface/IChatService";
import { IChatRepository } from "../../repositories/interface/IChatRepository";
import { ChatMessageDTO, ConversationDTO, ChatMessageResponse, ConversationResponse, ChatListResponse, MessageListResponse, AttachmentDTO, DoctorInfoDTO, UserInfoDTO } from "../../types/chat";
import { DoctorService } from "./DoctorService";
import { DoctorRepository } from "../../repositories/implementation/DoctorRepository";
import { UserService } from "./UserService";
import { UserRepository } from "../../repositories/implementation/UserRepository";
import { SlotRepository } from "../../repositories/implementation/SlotRepository";
import { SlotLockService } from "./SlotLockService";
import { PaymentService } from "./PaymentService";
import { ChatMessage } from "../../models/chatModel";
import { getFileUrl, getFileType } from "../../middlewares/fileUpload";

export class ChatService implements IChatService {
  private doctorService: DoctorService;
  private userRepository: UserRepository;

  constructor(private chatRepository: IChatRepository) {
    const doctorRepository = new DoctorRepository();
    const userRepository = new UserRepository();
    this.doctorService = new DoctorService(doctorRepository);
    this.userRepository = userRepository;
  }

  private toConversationResponse(conversation: any): ConversationResponse {
    return {
      id: (conversation._id ?? conversation.id).toString(),
      userId: String(conversation.userId),
      doctorId: String(conversation.doctorId),
      lastMessage: conversation.lastMessage ?? undefined,
      lastMessageTime: conversation.lastMessageTime ?? undefined,
      unreadCount: typeof conversation.unreadCount === 'number' ? conversation.unreadCount : 0,
      isActive: Boolean(conversation.isActive),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private toMessageResponse(message: any): ChatMessageResponse {
    return {
      id: (message._id ?? message.id).toString(),
      conversationId: String(message.conversationId),
      senderId: String(message.senderId),
      senderType: message.senderType,
      message: message.message,
      messageType: message.messageType,
      timestamp: message.timestamp,
      isRead: Boolean(message.isRead),
      isDeleted: Boolean(message.isDeleted),
      deletedAt: message.deletedAt ?? undefined,
      deletedBy: message.deletedBy ?? undefined,
      attachments: Array.isArray(message.attachments) ? message.attachments : [],
    };
  }

  // Conversation methods
  async createConversation(userId: string, doctorId: string): Promise<ConversationResponse> {
    console.log("Creating conversation for userId:", userId, "doctorId:", doctorId);
    
    // Check if conversation already exists
    const existingConversation = await this.chatRepository.getConversation(userId, doctorId);
    if (existingConversation) {
      console.log("Found existing conversation:", existingConversation);
      return this.toConversationResponse(existingConversation);
    }

    const conversationData: ConversationDTO = {
      userId,
      doctorId,
      unreadCount: 0,
      isActive: true,
    };

    console.log("Creating new conversation with data:", conversationData);
    const created = await this.chatRepository.createConversation(conversationData);
    return this.toConversationResponse(created);
  }

  async getConversation(userId: string, doctorId: string): Promise<ConversationResponse | null> {
    const conv = await this.chatRepository.getConversation(userId, doctorId);
    return conv ? this.toConversationResponse(conv) : null;
  }

  async getConversationById(conversationId: string): Promise<ConversationResponse | null> {
    const conv = await this.chatRepository.getConversationById(conversationId);
    return conv ? this.toConversationResponse(conv) : null;
  }

  async getUserConversations(userId: string, page: number, limit: number): Promise<ChatListResponse> {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 20;

    const list = await this.chatRepository.getUserConversations(userId, page, limit);
    return {
      ...list,
      conversations: list.conversations.map(this.toConversationResponse),
    };
  }

  async getDoctorConversations(doctorId: string, page: number, limit: number): Promise<ChatListResponse> {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 20;

    const list = await this.chatRepository.getDoctorConversations(doctorId, page, limit);
    return {
      ...list,
      conversations: list.conversations.map(this.toConversationResponse),
    };
  }

  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    
    const conversation = await this.chatRepository.getConversationById(conversationId);
    if (!conversation || (conversation.userId !== userId && conversation.doctorId !== userId)) {
      throw new Error("Conversation not found or access denied");
    }

    return await this.chatRepository.deleteConversation(conversationId);
  }

  async getDoctorInfo(doctorId: string): Promise<DoctorInfoDTO> {
    try {
      const doctor = await this.doctorService.getDoctorProfile(doctorId);
      if (!doctor) {
        throw new Error("Doctor not found");
      }
      
      const dto: DoctorInfoDTO = {
        id: doctor.id?.toString?.() ?? String(doctor.id),
        name: doctor.name,
        avatar: doctor.image || "https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=100&h=100&fit=crop&crop=face",
        isOnline: true, 
        specialization: doctor.speciality,
        lastSeen: "2 min ago" 
      };
      return dto;
    } catch (error) {
      throw new Error("Failed to fetch doctor information");
    }
  }

  async getUserInfo(userId: string): Promise<UserInfoDTO> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const dto: UserInfoDTO = {
        id: user._id,
        name: user.name,
        avatar: user.image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        isOnline: true,
        lastSeen: "2 min ago" 
      };
      return dto;
    } catch (error) {
      throw new Error("Failed to fetch user information");
    }
  }

  // Message methods
  async sendMessage(messageData: ChatMessageDTO, senderId: string): Promise<ChatMessageResponse> {
    console.log("ChatService.sendMessage called with:", { messageData, senderId });
    
    // Validate message 
    if (!messageData.message || messageData.message.trim().length === 0) {
      throw new Error("Message cannot be empty");
    }

    if (!messageData.conversationId) {
      throw new Error("Conversation ID is required");
    }

    
    const conversation = await this.chatRepository.getConversationById(messageData.conversationId);
    console.log("Found conversation for message:", conversation);
    
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    console.log("Conversation userId:", conversation.userId, "doctorId:", conversation.doctorId, "senderId:", senderId);
    
    
    const senderIdString = senderId.toString();
    
    if (conversation.userId !== senderIdString && conversation.doctorId !== senderIdString) {
      throw new Error("Access denied to this conversation");
    }

    
    const senderType = conversation.userId === senderIdString ? "user" : "doctor";
    console.log("Determined sender type:", senderType);

    const messageToSend: ChatMessageDTO = {
      ...messageData,
      senderId,
      senderType,
      message: messageData.message.trim(),
    };
    
    console.log("Message to send:", messageToSend);

    return await this.chatRepository.createMessage(messageToSend);
  }

  async getMessages(conversationId: string, page: number, limit: number): Promise<MessageListResponse> {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 50;

   
    const conversation = await this.chatRepository.getConversationById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const res = await this.chatRepository.getMessages(conversationId, page, limit);
    return {
      ...res,
      messages: res.messages.map(this.toMessageResponse),
      conversationId,
    };
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<boolean> {
    console.log("ChatService.markConversationAsRead called with:", { conversationId, userId });
    
    
    const conversation = await this.chatRepository.getConversationById(conversationId);
    console.log("Found conversation:", conversation);
    
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    
    console.log("Conversation userId:", conversation.userId, "doctorId:", conversation.doctorId, "requested userId:", userId);
    
    
    const userIdString = userId.toString();
    
    if (conversation.userId !== userIdString && conversation.doctorId !== userIdString) {
      throw new Error("Access denied to this conversation");
    }

    const result = await this.chatRepository.markConversationAsRead(conversationId, userId);
    console.log("markConversationAsRead result:", result);
    return result;
  }

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    
    const conversation = await this.chatRepository.getConversationById(conversationId);
    if (!conversation || (conversation.userId !== userId.toString() && conversation.doctorId !== userId.toString())) {
      throw new Error("Conversation not found or access denied");
    }

    return await this.chatRepository.getUnreadCount(conversationId, userId);
  }

  async deleteMessage(messageId: string, senderId: string): Promise<boolean> {
    
    const message = await this.chatRepository.getMessageById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== senderId) {
      throw new Error("You can only delete your own messages");
    }

    return await this.chatRepository.deleteMessage(messageId);
  }

  async softDeleteMessage(messageId: string, senderId: string): Promise<boolean> {
    
    const message = await this.chatRepository.getMessageById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const senderIdString = senderId.toString();
    if (message.senderId !== senderIdString) {
      throw new Error("You can only delete your own messages");
    }

    return await this.chatRepository.softDeleteMessage(messageId);
  }

 
  async sendMessageWithFiles(
    conversationId: string,
    senderId: string,
    senderType: "user" | "doctor",
    message: string,
    files: Express.Multer.File[]
  ): Promise<ChatMessageResponse> {
    const attachments = await this.processUploadedFiles(files);
    
    const firstType = attachments[0]?.fileType;
    const messageType: "image" | "file" = firstType === "image" ? "image" : "file";

    const messageData: ChatMessageDTO = {
      conversationId,
      senderId,
      senderType,
      message: message?.trim() || (messageType === "image" ? "[Image]" : "[File]"),
      messageType,
      attachments,
    };

    return await this.sendMessage(messageData, senderId);
  }

  async processUploadedFiles(files: Express.Multer.File[]): Promise<AttachmentDTO[]> {
    return files.map((file) => ({
      fileName: file.filename,
      originalName: file.originalname,
      fileType: getFileType(file.mimetype),
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: getFileUrl(file.path),
      uploadedAt: new Date(),
    }));
  }

  async deleteUploadedFiles(attachments: AttachmentDTO[]): Promise<void> {
   
    return;
  }

  getFileUrl(filePath: string): string {
    return getFileUrl(filePath);
  }
} 