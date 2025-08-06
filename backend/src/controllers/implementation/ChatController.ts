import { Request, Response } from "express";
import { IChatController } from "../interface/IChatController.interface";
import { IChatService } from "../../services/interface/IChatService";
import { HttpStatus } from "../../constants/status.constants";
import { HttpResponse } from "../../constants/responseMessage.constants";
import { ChatMessageDTO } from "../../types/chat";

export class ChatController implements IChatController {
  constructor(private chatService: IChatService) {}

  // Conversation methods
  async createConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { doctorId } = req.body;

      console.log("createConversation called with:", { userId, doctorId });

      if (!doctorId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Doctor ID is required",
        });
        return;
      }

      const conversation = await this.chatService.createConversation(userId, doctorId);
      console.log("Created conversation:", conversation);
      
      res.status(HttpStatus.OK).json({
        success: true,
        conversation,
      });
    } catch (error) {
      console.error("Error in createConversation:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { doctorId } = req.params;

      console.log("getConversation called with:", { userId, doctorId });

      if (!doctorId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Doctor ID is required",
        });
        return;
      }

      const conversation = await this.chatService.getConversation(userId, doctorId);
      console.log("Found conversation:", conversation);
      
      // Get doctor information
      const doctorInfo = await this.chatService.getDoctorInfo(doctorId);
      console.log("Doctor info:", doctorInfo);
      
      res.status(HttpStatus.OK).json({
        success: true,
        conversation,
        doctor: doctorInfo,
      });
    } catch (error) {
      console.error("Error in getConversation:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async getUserConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const conversations = await this.chatService.getUserConversations(userId, page, limit);
      
      res.status(HttpStatus.OK).json({
        success: true,
        ...conversations,
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async getDoctorConversations(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).docId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const conversations = await this.chatService.getDoctorConversations(doctorId, page, limit);
      
      res.status(HttpStatus.OK).json({
        success: true,
        ...conversations,
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async deleteConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId || (req as any).docId;
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const deleted = await this.chatService.deleteConversation(conversationId, userId);
      
      res.status(HttpStatus.OK).json({
        success: true,
        message: deleted ? "Conversation deleted successfully" : "Conversation not found",
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  // Message methods
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId || (req as any).docId;
      const { conversationId, message, messageType = "text", attachments } = req.body;

      console.log("sendMessage called with:", { conversationId, message, userId });

      if (!conversationId || !message) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Conversation ID and message are required",
        });
        return;
      }

      const messageData: ChatMessageDTO = {
        conversationId,
        senderId: userId,
        senderType: "user", // Will be determined by service
        message,
        messageType,
        attachments,
      };

      const sentMessage = await this.chatService.sendMessage(messageData, userId);
      
      res.status(HttpStatus.OK).json({
        success: true,
        message: sentMessage,
      });
    } catch (error) {
      console.error("Error in sendMessage:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async sendDoctorMessage(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).docId;
      const { conversationId, message, messageType = "text", attachments } = req.body;

      console.log("sendDoctorMessage called with:", { conversationId, message, doctorId });

      if (!conversationId || !message) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Conversation ID and message are required",
        });
        return;
      }

      const messageData: ChatMessageDTO = {
        conversationId,
        senderId: doctorId,
        senderType: "doctor",
        message,
        messageType,
        attachments,
      };

      const sentMessage = await this.chatService.sendMessage(messageData, doctorId);
      
      res.status(HttpStatus.OK).json({
        success: true,
        message: sentMessage,
      });
    } catch (error) {
      console.error("Error in sendDoctorMessage:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId || (req as any).docId;
      const { conversationId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      console.log("getMessages called with:", { conversationId, userId, page, limit });

      if (!conversationId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const messages = await this.chatService.getMessages(conversationId, page, limit);
      
      res.status(HttpStatus.OK).json({
        success: true,
        ...messages,
      });
    } catch (error) {
      console.error("Error in getMessages:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async getConversationWithUserInfo(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).docId;
      const { conversationId } = req.params;

      console.log("getConversationWithUserInfo called with:", { conversationId, doctorId });

      if (!conversationId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const conversation = await this.chatService.getConversationById(conversationId);
      if (!conversation) {
        res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: "Conversation not found",
        });
        return;
      }

      // Get user information
      const userInfo = await this.chatService.getUserInfo(conversation.userId);
      
      res.status(HttpStatus.OK).json({
        success: true,
        conversation,
        user: userInfo,
      });
    } catch (error) {
      console.error("Error in getConversationWithUserInfo:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async getMessagesByDoctor(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { doctorId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!doctorId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Doctor ID is required",
        });
        return;
      }

      // First get the conversation
      const conversation = await this.chatService.getConversation(userId, doctorId);
      if (!conversation) {
        res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: "Conversation not found",
        });
        return;
      }

      // Then get messages for that conversation
      const messages = await this.chatService.getMessages(conversation.id, page, limit);
      
      res.status(HttpStatus.OK).json({
        success: true,
        ...messages,
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async markConversationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId || (req as any).docId;
      const { conversationId } = req.params;

      console.log("markConversationAsRead called with:", { conversationId, userId });

      if (!conversationId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const marked = await this.chatService.markConversationAsRead(conversationId, userId);
      
      res.status(HttpStatus.OK).json({
        success: true,
        message: marked ? "Conversation marked as read" : "No unread messages found",
      });
    } catch (error) {
      console.error("Error in markConversationAsRead:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId || (req as any).docId;
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const count = await this.chatService.getUnreadCount(conversationId, userId);
      
      res.status(HttpStatus.OK).json({
        success: true,
        unreadCount: count,
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId || (req as any).docId;
      const { messageId } = req.params;

      if (!messageId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Message ID is required",
        });
        return;
      }

      const deleted = await this.chatService.deleteMessage(messageId, userId);
      
      res.status(HttpStatus.OK).json({
        success: true,
        message: deleted ? "Message deleted successfully" : "Message not found",
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }
} 