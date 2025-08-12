import { IChatService } from "../interface/IChatService";
import { IChatRepository } from "../../repositories/interface/IChatRepository";
import { ChatMessageDTO, ConversationDTO, ChatMessageResponse, ConversationResponse, ChatListResponse, MessageListResponse } from "../../types/chat";
import { DoctorService } from "./DoctorService";
import { DoctorRepository } from "../../repositories/implementation/DoctorRepository";
import { UserService } from "./UserService";
import { UserRepository } from "../../repositories/implementation/UserRepository";
import { SlotRepository } from "../../repositories/implementation/SlotRepository";
import { SlotLockService } from "./SlotLockService";
import { PaymentService } from "./PaymentService";

export class ChatService implements IChatService {
  private doctorService: DoctorService;
  private userRepository: UserRepository;

  constructor(private chatRepository: IChatRepository) {
    const doctorRepository = new DoctorRepository();
    const userRepository = new UserRepository();
    this.doctorService = new DoctorService(doctorRepository);
    this.userRepository = userRepository;
  }

  // Conversation methods
  async createConversation(userId: string, doctorId: string): Promise<ConversationResponse> {
    console.log("Creating conversation for userId:", userId, "doctorId:", doctorId);
    
    // Check if conversation already exists
    const existingConversation = await this.chatRepository.getConversation(userId, doctorId);
    if (existingConversation) {
      console.log("Found existing conversation:", existingConversation);
      return existingConversation;
    }

    const conversationData: ConversationDTO = {
      userId,
      doctorId,
      unreadCount: 0,
      isActive: true,
    };

    console.log("Creating new conversation with data:", conversationData);
    return await this.chatRepository.createConversation(conversationData);
  }

  async getConversation(userId: string, doctorId: string): Promise<ConversationResponse | null> {
    return await this.chatRepository.getConversation(userId, doctorId);
  }

  async getConversationById(conversationId: string): Promise<ConversationResponse | null> {
    return await this.chatRepository.getConversationById(conversationId);
  }

  async getUserConversations(userId: string, page: number, limit: number): Promise<ChatListResponse> {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 20;

    return await this.chatRepository.getUserConversations(userId, page, limit);
  }

  async getDoctorConversations(doctorId: string, page: number, limit: number): Promise<ChatListResponse> {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 20;

    return await this.chatRepository.getDoctorConversations(doctorId, page, limit);
  }

  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    // Verify conversation exists and user has access
    const conversation = await this.chatRepository.getConversationById(conversationId);
    if (!conversation || (conversation.userId !== userId && conversation.doctorId !== userId)) {
      throw new Error("Conversation not found or access denied");
    }

    return await this.chatRepository.deleteConversation(conversationId);
  }

  async getDoctorInfo(doctorId: string): Promise<any> {
    try {
      const doctor = await this.doctorService.getDoctorProfile(doctorId);
      if (!doctor) {
        throw new Error("Doctor not found");
      }
      
      return {
        id: doctor._id,
        name: doctor.name,
        avatar: doctor.image || "https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=100&h=100&fit=crop&crop=face",
        isOnline: true, // This should be implemented with real online status
        specialization: doctor.speciality,
        lastSeen: "2 min ago" // This should be implemented with real last seen
      };
    } catch (error) {
      throw new Error("Failed to fetch doctor information");
    }
  }

  async getUserInfo(userId: string): Promise<any> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      return {
        id: user._id,
        name: user.name,
        avatar: user.image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        isOnline: true, // This should be implemented with real online status
        lastSeen: "2 min ago" // This should be implemented with real last seen
      };
    } catch (error) {
      throw new Error("Failed to fetch user information");
    }
  }

  // Message methods
  async sendMessage(messageData: ChatMessageDTO, senderId: string): Promise<ChatMessageResponse> {
    console.log("ChatService.sendMessage called with:", { messageData, senderId });
    
    // Validate message data
    if (!messageData.message || messageData.message.trim().length === 0) {
      throw new Error("Message cannot be empty");
    }

    if (!messageData.conversationId) {
      throw new Error("Conversation ID is required");
    }

    // Verify conversation exists and sender has access
    const conversation = await this.chatRepository.getConversationById(messageData.conversationId);
    console.log("Found conversation for message:", conversation);
    
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    console.log("Conversation userId:", conversation.userId, "doctorId:", conversation.doctorId, "senderId:", senderId);
    
    // Convert ObjectId to string for comparison
    const senderIdString = senderId.toString();
    
    if (conversation.userId !== senderIdString && conversation.doctorId !== senderIdString) {
      throw new Error("Access denied to this conversation");
    }

    // Determine sender type
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

    // Verify conversation exists
    const conversation = await this.chatRepository.getConversationById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return await this.chatRepository.getMessages(conversationId, page, limit);
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<boolean> {
    console.log("ChatService.markConversationAsRead called with:", { conversationId, userId });
    
    // Verify conversation exists and user has access
    const conversation = await this.chatRepository.getConversationById(conversationId);
    console.log("Found conversation:", conversation);
    
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    
    console.log("Conversation userId:", conversation.userId, "doctorId:", conversation.doctorId, "requested userId:", userId);
    
    // Convert ObjectId to string for comparison
    const userIdString = userId.toString();
    
    if (conversation.userId !== userIdString && conversation.doctorId !== userIdString) {
      throw new Error("Access denied to this conversation");
    }

    const result = await this.chatRepository.markConversationAsRead(conversationId, userId);
    console.log("markConversationAsRead result:", result);
    return result;
  }

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    // Verify conversation exists and user has access
    const conversation = await this.chatRepository.getConversationById(conversationId);
    if (!conversation || (conversation.userId !== userId.toString() && conversation.doctorId !== userId.toString())) {
      throw new Error("Conversation not found or access denied");
    }

    return await this.chatRepository.getUnreadCount(conversationId, userId);
  }

  async deleteMessage(messageId: string, senderId: string, userRole?: "user" | "doctor"): Promise<boolean> {
    // Verify message exists and sender has permission to delete
    const message = await this.chatRepository.getMessageById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if the sender is the one who sent the message
    if (message.senderId !== senderId) {
      throw new Error("You can only delete your own messages");
    }

    // Additional role-based validation
    if (userRole) {
      // Doctors can only delete doctor messages
      if (userRole === "doctor" && message.senderType !== "doctor") {
        throw new Error("Doctors can only delete their own doctor messages");
      }
      
      // Users can only delete user messages
      if (userRole === "user" && message.senderType !== "user") {
        throw new Error("Users can only delete their own user messages");
      }
    }

    return await this.chatRepository.deleteMessage(messageId);
  }
} 