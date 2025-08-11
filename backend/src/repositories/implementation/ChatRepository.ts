import { IChatRepository } from "../interface/IChatRepository";
import { ChatMessageDTO, ConversationDTO, ChatMessageResponse, ConversationResponse, ChatListResponse, MessageListResponse } from "../../types/chat";
import { ChatMessage, Conversation, IChatMessage, IConversation } from "../../models/chatModel";
import mongoose from "mongoose";

export class ChatRepository implements IChatRepository {
  // Conversation methods
  async createConversation(conversationData: ConversationDTO): Promise<ConversationResponse> {
    console.log("Creating conversation with data:", conversationData);
    const conversation = new Conversation(conversationData);
    const savedConversation = await conversation.save();
    console.log("Saved conversation:", savedConversation);
    return this.mapConversationToResponse(savedConversation);
  }

  async getConversation(userId: string, doctorId: string): Promise<ConversationResponse | null> {
    console.log("getConversation called with:", { userId, doctorId });
    const conversation = await Conversation.findOne({ userId, doctorId, isActive: true });
    console.log("Found conversation in DB:", conversation);
    return conversation ? this.mapConversationToResponse(conversation) : null;
  }

  async getConversationById(conversationId: string): Promise<ConversationResponse | null> {
    console.log("getConversationById called with:", conversationId);
    
    try {
      // Validate ObjectId format
      if (!conversationId || conversationId.length !== 24) {
        console.log("Invalid conversationId format:", conversationId);
        return null;
      }
      
      const conversation = await Conversation.findById(conversationId);
      console.log("Found conversation in DB:", conversation);
      return conversation ? this.mapConversationToResponse(conversation) : null;
    } catch (error) {
      console.error("Error in getConversationById:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      return null;
    }
  }

  async getUserConversations(userId: string, page: number, limit: number): Promise<ChatListResponse> {
    const skip = (page - 1) * limit;
    const conversations = await Conversation.find({ userId, isActive: true })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await Conversation.countDocuments({ userId, isActive: true });
    
    return {
      conversations: conversations.map(this.mapConversationToResponse),
      totalCount,
      page,
      limit,
    };
  }

  async getDoctorConversations(doctorId: string, page: number, limit: number): Promise<ChatListResponse> {
    const skip = (page - 1) * limit;
    const conversations = await Conversation.find({ doctorId, isActive: true })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await Conversation.countDocuments({ doctorId, isActive: true });
    
    return {
      conversations: conversations.map(this.mapConversationToResponse),
      totalCount,
      page,
      limit,
    };
  }

  async updateConversation(conversationId: string, updateData: Partial<ConversationDTO>): Promise<ConversationResponse | null> {
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      updateData,
      { new: true }
    );
    return conversation ? this.mapConversationToResponse(conversation) : null;
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    const result = await Conversation.findByIdAndUpdate(
      conversationId,
      { isActive: false },
      { new: true }
    );
    return !!result;
  }

  // Message methods
  async createMessage(messageData: ChatMessageDTO): Promise<ChatMessageResponse> {
    console.log("Creating message with data:", messageData);
    
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        throw new Error("MongoDB not connected. Ready state: " + mongoose.connection.readyState);
      }
      
      // Validate the data before creating
      if (!messageData.conversationId || !messageData.senderId || !messageData.message) {
        throw new Error("Missing required fields: conversationId, senderId, or message");
      }
      
      const message = new ChatMessage(messageData);
      console.log("Created message object:", message);
      
      const savedMessage = await message.save();
      console.log("Saved message:", savedMessage);
      
      // Update conversation with last message
      const conversationUpdate = await Conversation.findOneAndUpdate(
        { _id: messageData.conversationId },
        {
          lastMessage: messageData.message,
          lastMessageTime: new Date(),
          $inc: { unreadCount: 1 },
        },
        { new: true }
      );
      console.log("Conversation update result:", conversationUpdate);
      
      return this.mapMessageToResponse(savedMessage);
    } catch (error) {
      console.error("Error in createMessage:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw error;
    }
  }

  async getMessages(conversationId: string, page: number, limit: number): Promise<MessageListResponse> {
    const skip = (page - 1) * limit;
    const messages = await ChatMessage.find({ 
      conversationId,
      isDeleted: false // Only get non-deleted messages
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await ChatMessage.countDocuments({ 
      conversationId,
      isDeleted: false 
    });
    
    return {
      messages: messages.map(this.mapMessageToResponse),
      totalCount,
      page,
      limit,
      conversationId,
    };
  }

  async getMessageById(messageId: string): Promise<ChatMessageResponse | null> {
    const message = await ChatMessage.findById(messageId);
    return message ? this.mapMessageToResponse(message) : null;
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    const result = await ChatMessage.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true }
    );
    return !!result;
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<boolean> {
    console.log("ChatRepository.markConversationAsRead called with:", { conversationId, userId });
    
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        throw new Error("MongoDB not connected. Ready state: " + mongoose.connection.readyState);
      }
      
      // Validate inputs
      if (!conversationId || !userId) {
        throw new Error("Missing required fields: conversationId or userId");
      }
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error("Invalid conversationId format");
      }
      
      // Mark all unread messages in the conversation as read
      const result = await ChatMessage.updateMany(
        { 
          conversationId, 
          senderId: { $ne: userId },
          isRead: false,
          isDeleted: false // Only mark non-deleted messages as read
        },
        { isRead: true }
      );
      
      console.log("ChatMessage updateMany result:", result);
      
      // Reset unread count
      const conversationUpdate = await Conversation.findByIdAndUpdate(
        conversationId,
        { unreadCount: 0 },
        { new: true }
      );
      
      console.log("Conversation update result:", conversationUpdate);
      
      return result.modifiedCount > 0 || conversationUpdate !== null;
    } catch (error) {
      console.error("Error in markConversationAsRead:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      throw error;
    }
  }

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const count = await ChatMessage.countDocuments({
      conversationId,
      senderId: { $ne: userId },
      isRead: false,
      isDeleted: false, // Only count non-deleted messages
    });
    return count;
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    const result = await ChatMessage.findByIdAndDelete(messageId);
    return !!result;
  }

  async softDeleteMessage(messageId: string, deletedBy: string): Promise<boolean> {
    const result = await ChatMessage.findByIdAndUpdate(
      messageId,
      { 
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deletedBy
      },
      { new: true }
    );
    return !!result;
  }

  async restoreMessage(messageId: string): Promise<boolean> {
    const result = await ChatMessage.findByIdAndUpdate(
      messageId,
      { 
        isDeleted: false,
        $unset: { deletedAt: 1, deletedBy: 1 }
      },
      { new: true }
    );
    return !!result;
  }

  async permanentlyDeleteMessage(messageId: string): Promise<boolean> {
    const result = await ChatMessage.findByIdAndDelete(messageId);
    return !!result;
  }

  async getDeletedMessages(conversationId: string, page: number, limit: number): Promise<MessageListResponse> {
    const skip = (page - 1) * limit;
    const messages = await ChatMessage.find({ 
      conversationId,
      isDeleted: true 
    })
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await ChatMessage.countDocuments({ 
      conversationId,
      isDeleted: true 
    });
    
    return {
      messages: messages.map(this.mapMessageToResponse),
      totalCount,
      page,
      limit,
      conversationId,
    };
  }

  // Helper methods for mapping
  private mapConversationToResponse(conversation: IConversation): ConversationResponse {
    return {
      id: conversation._id.toString(),
      userId: conversation.userId,
      doctorId: conversation.doctorId,
      lastMessage: conversation.lastMessage,
      lastMessageTime: conversation.lastMessageTime,
      unreadCount: conversation.unreadCount,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private mapMessageToResponse(message: IChatMessage): ChatMessageResponse {
    return {
      id: message._id.toString(),
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderType: message.senderType,
      message: message.message,
      messageType: message.messageType,
      timestamp: message.timestamp,
      isRead: message.isRead,
      isDeleted: message.isDeleted,
      deletedAt: message.deletedAt,
      deletedBy: message.deletedBy,
      attachments: message.attachments.map(attachment => ({
        fileName: attachment.fileName,
        originalName: attachment.originalName,
        fileType: attachment.fileType,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        filePath: attachment.filePath,
        uploadedAt: attachment.uploadedAt,
      })),
    };
  }
} 