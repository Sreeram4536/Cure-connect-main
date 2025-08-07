import express from "express";
import { ChatController } from "../controllers/implementation/ChatController";
import { ChatService } from "../services/implementation/ChatService";
import { ChatRepository } from "../repositories/implementation/ChatRepository";
import authRole from "../middlewares/authRole";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/chat/'); // Create uploads/chat directory
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Allow images and common file types
  if (file.mimetype.startsWith('image/') || 
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('text/') ||
      file.mimetype.includes('document')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

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

chatRouter.post(
  "/messages/doctor",
  authRole(["doctor"]),
  chatController.sendDoctorMessage.bind(chatController)
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

chatRouter.delete(
  "/messages/:messageId",
  authRole(["user", "doctor"]),
  chatController.deleteMessage.bind(chatController)
);

// File upload routes
chatRouter.post(
  "/upload",
  authRole(["user", "doctor"]),
  upload.single('file'),
  chatController.uploadFile.bind(chatController)
);

chatRouter.post(
  "/messages/with-files",
  authRole(["user"]),
  upload.array('files', 5), // Allow up to 5 files
  chatController.sendMessageWithFiles.bind(chatController)
);

chatRouter.post(
  "/messages/doctor/with-files",
  authRole(["doctor"]),
  upload.array('files', 5), // Allow up to 5 files
  chatController.sendDoctorMessageWithFiles.bind(chatController)
);

export default chatRouter; 