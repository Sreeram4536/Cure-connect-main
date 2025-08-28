import express from "express";
import { ChatController } from "../controllers/implementation/ChatController";
import { ChatService } from "../services/implementation/ChatService";
import { ChatRepository } from "../repositories/implementation/ChatRepository";
import { DoctorService } from "../services/implementation/DoctorService";
import { DoctorRepository } from "../repositories/implementation/DoctorRepository";
import { UserRepository } from "../repositories/implementation/UserRepository";
import authRole from "../middlewares/authRole";
import { uploadChatFiles, handleUploadError } from "../middlewares/fileUpload";
import { AppointmentRepository } from "../repositories/implementation/AppointmentRepository";
import { WalletRepository } from "../repositories/implementation/WalletRepository";
import { WalletService } from "../services/implementation/WalletService";
import { SlotLockService } from "../services/implementation/SlotLockService";
import { chatController } from "../dependencyhandler/chat.dependency";


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
  chatController.uploadFilesForDoctor.bind(chatController)
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

// Removed restore/permanent/deleted listing routes per simplified requirements

// Legacy delete route (now does soft delete)
chatRouter.delete(
  "/messages/:messageId",
  authRole(["user", "doctor"]),
  chatController.softDeleteMessage.bind(chatController)
);

// File serving route
chatRouter.get(
  "/files/:fileName",
  chatController.serveFile.bind(chatController)
);

// Simple upload-only endpoint for users (alias for legacy frontend)
chatRouter.post(
  "/upload",
  authRole(["user"]),
  uploadChatFiles,
  handleUploadError,
  chatController.uploadFilesForUser.bind(chatController)
);

export default chatRouter; 