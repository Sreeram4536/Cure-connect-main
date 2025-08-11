import express from "express";
import { ChatController } from "../controllers/implementation/ChatController";
import { ChatService } from "../services/implementation/ChatService";
import { ChatRepository } from "../repositories/implementation/ChatRepository";
import authRole from "../middlewares/authRole";
import { uploadChatFiles, handleUploadError } from "../middlewares/fileUpload";

const chatRepository = new ChatRepository();
const chatService = new ChatService(chatRepository);
const chatController = new ChatController(chatService);

const chatRouter = express.Router();

// Conversation routes
chatRouter.post(
  "/conversations",
  authRole(["user"]),
  chatController.createConversation.bind(chatController)
);

chatRouter.get(
  "/conversations/:doctorId",
  authRole(["user"]),
  chatController.getConversation.bind(chatController)
);

chatRouter.get(
  "/conversations",
  authRole(["user"]),
  chatController.getUserConversations.bind(chatController)
);

chatRouter.get(
  "/doctor/conversations",
  authRole(["doctor"]),
  chatController.getDoctorConversations.bind(chatController)
);

chatRouter.delete(
  "/conversations/:conversationId",
  authRole(["user", "doctor"]),
  chatController.deleteConversation.bind(chatController)
);

chatRouter.get(
  "/conversations/:conversationId/with-user",
  authRole(["doctor"]),
  chatController.getConversationWithUserInfo.bind(chatController)
);

// Message routes
chatRouter.post(
  "/messages",
  authRole(["user"]),
  chatController.sendMessage.bind(chatController)
);

// New file upload routes
chatRouter.post(
  "/messages/upload",
  authRole(["user"]),
  uploadChatFiles,
  handleUploadError,
  chatController.sendMessageWithFiles.bind(chatController)
);

chatRouter.post(
  "/messages/doctor",
  authRole(["doctor"]),
  chatController.sendDoctorMessage.bind(chatController)
);

chatRouter.post(
  "/messages/doctor/upload",
  authRole(["doctor"]),
  uploadChatFiles,
  handleUploadError,
  chatController.sendDoctorMessageWithFiles.bind(chatController)
);

chatRouter.get(
  "/messages/:conversationId",
  authRole(["user", "doctor"]),
  chatController.getMessages.bind(chatController)
);

// Route to get messages by doctor ID (for user convenience)
chatRouter.get(
  "/messages/doctor/:doctorId",
  authRole(["user"]),
  chatController.getMessagesByDoctor.bind(chatController)
);

// Enhanced message management routes
chatRouter.patch(
  "/conversations/:conversationId/read",
  authRole(["user", "doctor"]),
  chatController.markConversationAsRead.bind(chatController)
);

chatRouter.get(
  "/conversations/:conversationId/unread",
  authRole(["user", "doctor"]),
  chatController.getUnreadCount.bind(chatController)
);

// Soft delete message (keeps in database but marks as deleted)
chatRouter.patch(
  "/messages/:messageId/soft-delete",
  authRole(["user", "doctor"]),
  chatController.softDeleteMessage.bind(chatController)
);

// Restore soft-deleted message
chatRouter.patch(
  "/messages/:messageId/restore",
  authRole(["user", "doctor"]),
  chatController.restoreMessage.bind(chatController)
);

// Permanently delete message (removes from database and files)
chatRouter.delete(
  "/messages/:messageId/permanent",
  authRole(["user", "doctor"]),
  chatController.permanentlyDeleteMessage.bind(chatController)
);

// Get deleted messages
chatRouter.get(
  "/messages/:conversationId/deleted",
  authRole(["user", "doctor"]),
  chatController.getDeletedMessages.bind(chatController)
);

// Legacy delete route (now does soft delete)
chatRouter.delete(
  "/messages/:messageId",
  authRole(["user", "doctor"]),
  chatController.softDeleteMessage.bind(chatController)
);

// File serving route
chatRouter.get(
  "/files/:fileName",
  authRole(["user", "doctor"]),
  chatController.serveFile.bind(chatController)
);

export default chatRouter; 