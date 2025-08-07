import { Request, Response } from "express";

export interface IChatController {
  // Conversation methods
  createConversation(req: Request, res: Response): Promise<void>;
  getConversation(req: Request, res: Response): Promise<void>;
  getUserConversations(req: Request, res: Response): Promise<void>;
  getDoctorConversations(req: Request, res: Response): Promise<void>;
  deleteConversation(req: Request, res: Response): Promise<void>;

  // Message methods
  sendMessage(req: Request, res: Response): Promise<void>;
  sendDoctorMessage(req: Request, res: Response): Promise<void>;
  getMessages(req: Request, res: Response): Promise<void>;
  getMessagesByDoctor(req: Request, res: Response): Promise<void>;
  markConversationAsRead(req: Request, res: Response): Promise<void>;
  getUnreadCount(req: Request, res: Response): Promise<void>;
  deleteMessage(req: Request, res: Response): Promise<void>;
  
  // File upload methods
  uploadFile(req: Request, res: Response): Promise<void>;
  sendMessageWithFiles(req: Request, res: Response): Promise<void>;
  sendDoctorMessageWithFiles(req: Request, res: Response): Promise<void>;
} 