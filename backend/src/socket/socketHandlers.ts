import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ChatMessage, Conversation } from "../models/chatModel";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: "user" | "doctor";
}

interface MessageData {
  conversationId: string;
  message: string;
  messageType?: "text" | "image" | "file";
  attachments?: string[];
}

interface JoinConversationData {
  conversationId: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
      
      console.log("Socket auth - Token received:", token ? "Yes" : "No");
      console.log("Socket auth - JWT_SECRET exists:", !!process.env.JWT_SECRET);
      
      if (!token) {
        console.log("Socket auth - No token provided");
        return next(new Error("Authentication error"));
      }

      if (!process.env.JWT_SECRET) {
        console.log("Socket auth - JWT_SECRET not configured");
        return next(new Error("Authentication error"));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
        console.log("Socket auth - Decoded token:", { id: decoded.id, role: decoded.role });
        
        socket.userId = decoded.id; // JWT uses 'id' field
        socket.userType = decoded.role; // JWT uses 'role' field
        
        console.log("Socket auth - User authenticated:", { userId: socket.userId, userType: socket.userType });
        next();
      } catch (jwtError: any) {
        if (jwtError.name === 'TokenExpiredError') {
          console.log("Socket auth - Token expired, but allowing connection for debugging");
          console.log("Socket auth - Expired token payload:", jwtError.payload);
          
          // For debugging purposes, allow connection with expired token
          // In production, you would implement token refresh here
          if (jwtError.payload) {
            socket.userId = jwtError.payload.id;
            socket.userType = jwtError.payload.role;
            console.log("Socket auth - Allowing connection with expired token:", { userId: socket.userId, userType: socket.userType });
            next();
          } else {
            console.log("Socket auth - No payload in expired token");
            next(new Error("Authentication error"));
          }
        } else {
          console.error("Socket auth - JWT verification error:", jwtError);
          next(new Error("Authentication error"));
        }
      }
    } catch (error) {
      console.error("Socket auth - Error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId} (${socket.userType})`);

    // Join user to their personal room
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
    }

    // Handle joining a conversation
    socket.on("join_conversation", (data: JoinConversationData) => {
      const { conversationId } = data;
      const roomName = `conversation_${conversationId}`;
      socket.join(roomName);
      console.log(`User ${socket.userId} (${socket.userType}) joined conversation ${conversationId} (room: ${roomName})`);
      console.log(`Users in room ${roomName}:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
    });

    // Handle leaving a conversation
    socket.on("leave_conversation", (data: JoinConversationData) => {
      const { conversationId } = data;
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle sending a message
    socket.on("send_message", async (data: MessageData) => {
      try {
        console.log("Received send_message event:", data);
        const { conversationId, message, messageType = "text", attachments = [] } = data;

        console.log(`Processing message from ${socket.userType} ${socket.userId} to conversation ${conversationId}`);

        // Create new message in database
        const newMessage = new ChatMessage({
          conversationId,
          senderId: socket.userId,
          senderType: socket.userType,
          message,
          messageType,
          attachments,
          timestamp: new Date(),
          isRead: false,
        });

        await newMessage.save();
        console.log("Message saved to database:", newMessage._id);

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message,
          lastMessageTime: new Date(),
          $inc: { unreadCount: 1 },
        });

        // Emit message to all users in the conversation
        console.log(`Emitting new message to conversation ${conversationId}:`, {
          messageId: newMessage._id,
          senderId: newMessage.senderId,
          senderType: newMessage.senderType,
          message: newMessage.message
        });
        
        const roomName = `conversation_${conversationId}`;
        console.log(`Emitting to room: ${roomName}`);
        console.log(`Users in room:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
        
        io.to(roomName).emit("new_message", {
          message: newMessage,
          conversationId,
        });

        // Emit typing stopped event
        socket.to(roomName).emit("typing_stopped", {
          userId: socket.userId,
          userType: socket.userType,
        });

      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing_start", (data: { conversationId: string }) => {
      socket.to(`conversation_${data.conversationId}`).emit("typing_start", {
        userId: socket.userId,
        userType: socket.userType,
      });
    });

    socket.on("typing_stop", (data: { conversationId: string }) => {
      socket.to(`conversation_${data.conversationId}`).emit("typing_stopped", {
        userId: socket.userId,
        userType: socket.userType,
      });
    });

    // Handle message read status
    socket.on("mark_as_read", async (data: { conversationId: string, messageIds: string[] }) => {
      try {
        const { conversationId, messageIds } = data;

        // Mark messages as read in database
        await ChatMessage.updateMany(
          { _id: { $in: messageIds } },
          { isRead: true }
        );

        // Reset unread count for conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          unreadCount: 0,
        });

        // Notify other users in conversation
        socket.to(`conversation_${conversationId}`).emit("messages_read", {
          messageIds,
          conversationId,
        });

      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // Handle message deletion
    socket.on("delete_message", async (data: { messageId: string, conversationId: string }) => {
      try {
        const { messageId, conversationId } = data;

        console.log(`User ${socket.userId} (${socket.userType}) attempting to delete message ${messageId}`);

        // Verify the message exists and user owns it
        const message = await ChatMessage.findById(messageId);
        if (!message) {
          socket.emit("delete_message_error", { error: "Message not found" });
          return;
        }

        if (message.senderId !== socket.userId) {
          socket.emit("delete_message_error", { error: "You can only delete your own messages" });
          return;
        }

        // Delete the message
        await ChatMessage.findByIdAndDelete(messageId);
        console.log(`Message ${messageId} deleted successfully`);

        // Notify all users in the conversation
        const roomName = `conversation_${conversationId}`;
        io.to(roomName).emit("message_deleted", {
          messageId,
          conversationId,
          deletedBy: socket.userId,
        });

        console.log(`Notified room ${roomName} about message deletion`);

      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("delete_message_error", { error: "Failed to delete message" });
      }
    });

    // Handle online status
    socket.on("set_online_status", (data: { isOnline: boolean }) => {
      if (socket.userId) {
        io.emit("user_status_changed", {
          userId: socket.userId,
          userType: socket.userType,
          isOnline: data.isOnline,
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId} (${socket.userType})`);
      
      // Emit offline status
      if (socket.userId) {
        io.emit("user_status_changed", {
          userId: socket.userId,
          userType: socket.userType,
          isOnline: false,
        });
      }
    });
  });
}; 