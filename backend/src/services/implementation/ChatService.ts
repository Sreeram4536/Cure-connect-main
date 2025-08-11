import { IChatService } from "../interface/IChatService";
import { IChatRepository } from "../../repositories/interface/IChatRepository";
import { ChatMessageDTO, ConversationDTO, ChatMessageResponse, ConversationResponse, ChatListResponse, MessageListResponse, AttachmentDTO } from "../../types/chat";
import { DoctorService } from "./DoctorService";
import { DoctorRepository } from "../../repositories/implementation/DoctorRepository";
import { UserService } from "./UserService";
import { UserRepository } from "../../repositories/implementation/UserRepository";
import { SlotRepository } from "../../repositories/implementation/SlotRepository";
import { SlotLockService } from "./SlotLockService";
import { PaymentService } from "./PaymentService";
import { getFileType, getFileUrl } from "../../middlewares/fileUpload";
import fs from 'fs';
import path from 'path';

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

  // Enhanced message methods
  async sendMessage(messageData: ChatMessageDTO, senderId: string): Promise<ChatMessageResponse> {
    console.log("Sending message:", messageData);

    // Validate sender
    if (messageData.senderId !== senderId) {
      throw new Error("Sender ID mismatch");
    }

    // Validate conversation exists
    const conversation = await this.chatRepository.getConversationById(messageData.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if sender is part of the conversation
    if (messageData.senderType === "user" && conversation.userId !== senderId) {
      throw new Error("User not authorized for this conversation");
    }
    if (messageData.senderType === "doctor" && conversation.doctorId !== senderId) {
      throw new Error("Doctor not authorized for this conversation");
    }

    return await this.chatRepository.createMessage(messageData);
  }

  async sendMessageWithFiles(
    conversationId: string,
    senderId: string,
    senderType: "user" | "doctor",
    message: string,
    files: Express.Multer.File[]
  ): Promise<ChatMessageResponse> {
    try {
      // Validate conversation exists
      const conversation = await this.chatRepository.getConversationById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Check authorization
      if (senderType === "user" && conversation.userId !== senderId) {
        throw new Error("User not authorized for this conversation");
      }
      if (senderType === "doctor" && conversation.doctorId !== senderId) {
        throw new Error("Doctor not authorized for this conversation");
      }

      // Process uploaded files
      const attachments = await this.processUploadedFiles(files);

      // Determine message type
      let messageType: "text" | "image" | "file" | "mixed" = "text";
      if (attachments.length > 0) {
        const hasImages = attachments.some(att => att.fileType === "image");
        const hasDocuments = attachments.some(att => att.fileType === "document");
        
        if (hasImages && hasDocuments) {
          messageType = "mixed";
        } else if (hasImages) {
          messageType = "image";
        } else {
          messageType = "file";
        }
      }

      const messageData: ChatMessageDTO = {
        conversationId,
        senderId,
        senderType,
        message: message || "",
        messageType,
        attachments,
      };

      return await this.chatRepository.createMessage(messageData);
    } catch (error) {
      // Clean up uploaded files if message creation fails
      if (files && files.length > 0) {
        this.cleanupFiles(files);
      }
      throw error;
    }
  }

  async getMessages(conversationId: string, page: number, limit: number): Promise<MessageListResponse> {
    return await this.chatRepository.getMessages(conversationId, page, limit);
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<boolean> {
    return await this.chatRepository.markConversationAsRead(conversationId, userId);
  }

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    return await this.chatRepository.getUnreadCount(conversationId, userId);
  }

  async deleteMessage(messageId: string, senderId: string): Promise<boolean> {
    // Get message to verify ownership
    const message = await this.chatRepository.getMessageById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== senderId) {
      throw new Error("Not authorized to delete this message");
    }

    return await this.chatRepository.deleteMessage(messageId);
  }

  async softDeleteMessage(messageId: string, deletedBy: string): Promise<boolean> {
    // Get message to verify ownership
    const message = await this.chatRepository.getMessageById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== deletedBy) {
      throw new Error("Not authorized to delete this message");
    }

    return await this.chatRepository.softDeleteMessage(messageId, deletedBy);
  }

  async restoreMessage(messageId: string, userId: string): Promise<boolean> {
    // Get message to verify ownership
    const message = await this.chatRepository.getMessageById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== userId && message.deletedBy !== userId) {
      throw new Error("Not authorized to restore this message");
    }

    return await this.chatRepository.restoreMessage(messageId);
  }

  async permanentlyDeleteMessage(messageId: string, userId: string): Promise<boolean> {
    // Get message to verify ownership and clean up files
    const message = await this.chatRepository.getMessageById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== userId) {
      throw new Error("Not authorized to permanently delete this message");
    }

    // Delete associated files
    if (message.attachments && message.attachments.length > 0) {
      await this.deleteUploadedFiles(message.attachments);
    }

    return await this.chatRepository.permanentlyDeleteMessage(messageId);
  }

  async getDeletedMessages(conversationId: string, page: number, limit: number): Promise<MessageListResponse> {
    return await this.chatRepository.getDeletedMessages(conversationId, page, limit);
  }

  // File management methods
  async processUploadedFiles(files: Express.Multer.File[]): Promise<AttachmentDTO[]> {
    const attachments: AttachmentDTO[] = [];

    for (const file of files) {
      const attachment: AttachmentDTO = {
        fileName: file.filename,
        originalName: file.originalname,
        fileType: getFileType(file.mimetype),
        mimeType: file.mimetype,
        fileSize: file.size,
        filePath: file.path,
        uploadedAt: new Date(),
      };
      attachments.push(attachment);
    }

    return attachments;
  }

  async deleteUploadedFiles(attachments: AttachmentDTO[]): Promise<void> {
    for (const attachment of attachments) {
      try {
        if (fs.existsSync(attachment.filePath)) {
          fs.unlinkSync(attachment.filePath);
        }
      } catch (error) {
        console.error(`Failed to delete file ${attachment.filePath}:`, error);
      }
    }
  }

  getFileUrl(filePath: string): string {
    return getFileUrl(filePath);
  }

  private cleanupFiles(files: Express.Multer.File[]): void {
    files.forEach(file => {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (error) {
        console.error(`Failed to cleanup file ${file.path}:`, error);
      }
    });
  }
} 