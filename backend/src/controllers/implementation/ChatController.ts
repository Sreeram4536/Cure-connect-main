import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { IChatController } from "../interface/IChatController.interface";
import { IChatService } from "../../services/interface/IChatService";
import { HttpStatus } from "../../constants/status.constants";
import { ChatMessageDTO } from "../../types/chat";
import { AuthRequest } from "../../types/customRequest";

export class ChatController implements IChatController {
  constructor(private _chatService: IChatService) {}

  // Conversation methods
  async createConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: "User ID not found",
        });
        return;
      }
      const { doctorId } = req.body;

      console.log("createConversation called with:", { userId, doctorId });

      if (!doctorId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Doctor ID is required",
        });
        return;
      }

      const conversation = await this._chatService.createConversation(userId, doctorId);
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
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "User ID not found" });
        return;
      }
      const { doctorId } = req.params;

      console.log("getConversation called with:", { userId, doctorId });

      if (!doctorId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Doctor ID is required",
        });
        return;
      }

      const conversation = await this._chatService.getConversation(userId, doctorId);
      console.log("Found conversation:", conversation);
      
      // Get doctor information
      const doctorInfo = await this._chatService.getDoctorInfo(doctorId);
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
      const userId = (req as AuthRequest).userId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "User ID not found" });
        return;
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const conversations = await this._chatService.getUserConversations(userId, page, limit);
      
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
      const doctorId = (req as AuthRequest).docId;
      if (!doctorId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Doctor ID not found" });
        return;
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const conversations = await this._chatService.getDoctorConversations(doctorId, page, limit);
      
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
      const userId = (req as AuthRequest).userId || (req as AuthRequest).docId;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "User ID not found" });
        return;
      }
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const deleted = await this._chatService.deleteConversation(conversationId, userId);
      
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
      let senderId: string | undefined;
      let senderType: "user" | "doctor" | undefined;
      if ((req as AuthRequest).userId) {
        senderId = (req as AuthRequest).userId;
        senderType = "user";
      } else if ((req as AuthRequest).docId) {
        senderId = (req as AuthRequest).docId;
        senderType = "doctor";
      }
      if (!senderId || !senderType) {
        res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Sender not authenticated" });
        return;
      }
      const { conversationId, message, messageType = "text", attachments } = req.body;

      console.log("sendMessage called with:", { conversationId, message, senderId, senderType });

      if (!conversationId || !message) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Conversation ID and message are required",
        });
        return;
      }

      const messageData: ChatMessageDTO = {
        conversationId,
        senderId,
        senderType,
        message,
        messageType,
        attachments,
      };

      const sentMessage = await this._chatService.sendMessage(messageData, senderId);
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

  async sendMessageWithFiles(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { conversationId, message } = req.body;
      const files = (req as any).files as Express.Multer.File[];

      if (!conversationId || !files || files.length === 0) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Conversation ID and files are required" });
        return;
      }

      const sent = await this._chatService.sendMessageWithFiles(conversationId, userId, "user", message, files);
      res.status(HttpStatus.OK).json({ success: true, message: sent });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
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

      const sentMessage = await this._chatService.sendMessage(messageData, doctorId);
      
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

  
  async uploadFilesForUser(req: Request, res: Response): Promise<void> {
    try {
      const files = (req as any).files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "No files uploaded" });
        return;
      }
      const [attachment] = await this._chatService.processUploadedFiles(files);
      res.status(HttpStatus.OK).json({ success: true, url: attachment.filePath });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
    }
  }

  async uploadFilesForDoctor(req: Request, res: Response): Promise<void> {
    try {
      const files = (req as any).files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "No files uploaded" });
        return;
      }
      const [attachment] = await this._chatService.processUploadedFiles(files);
      res.status(HttpStatus.OK).json({ success: true, url: attachment.filePath });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
    }
  }
   async sendDoctorMessageWithFiles(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).docId;
      const { conversationId, message } = req.body;
      const files = (req as any).files as Express.Multer.File[];

      if (!conversationId || !files || files.length === 0) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "Conversation ID and files are required" });
        return;
      }

      const sent = await this._chatService.sendMessageWithFiles(conversationId, doctorId, "doctor", message, files);
      res.status(HttpStatus.OK).json({ success: true, message: sent });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
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

      const messages = await this._chatService.getMessages(conversationId, page, limit);
      
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
      const doctorId = (req as AuthRequest).docId;
      const { conversationId } = req.params;

      console.log("getConversationWithUserInfo called with:", { conversationId, doctorId });

      if (!conversationId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Conversation ID is required",
        });
        return;
      }

      const conversation = await this._chatService.getConversationById(conversationId);
      if (!conversation) {
        res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: "Conversation not found",
        });
        return;
      }

      
      const userInfo = await this._chatService.getUserInfo(conversation.userId);
      
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

      
      const conversation = await this._chatService.getConversation(userId, doctorId);
      if (!conversation) {
        res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: "Conversation not found",
        });
        return;
      }

      
      const messages = await this._chatService.getMessages(conversation.id, page, limit);
      
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

      const marked = await this._chatService.markConversationAsRead(conversationId, userId);
      
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

      const count = await this._chatService.getUnreadCount(conversationId, userId);
      
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

      const deleted = await this._chatService.deleteMessage(messageId, userId);
      
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

  async softDeleteMessage(req: Request, res: Response): Promise<void> {
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

      const deleted = await this._chatService.softDeleteMessage(messageId, userId);
      
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


  async serveFile(req: Request, res: Response): Promise<void> {
    try {
      const fileName = path.basename(req.params.fileName);
      const absolute = path.join(process.cwd(), 'uploads', 'chat', fileName);
      if (!fs.existsSync(absolute)) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'File not found' });
        return;
      }
      res.sendFile(absolute);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to serve file' });
    }
  }
} 