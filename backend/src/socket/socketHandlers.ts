import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ChatMessage, Conversation } from "../models/chatModel";
import { AttachmentDTO } from "../types/chat";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: "user" | "doctor";
}

interface MessageData {
  conversationId: string;
  message: string;
  messageType?: "text" | "image" | "file" | "mixed";
  attachments?: AttachmentDTO[] | string[];
}

interface JoinConversationData {
  conversationId: string;
}

interface MessageActionData {
  messageId: string;
  conversationId: string;
  action: "delete" | "restore" | "permanent_delete";
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
        const attachmentUrls = (attachments as any[]).map((a) => (typeof a === "string" ? a : a?.filePath)).filter(Boolean);

        const newMessage = new ChatMessage({
          conversationId,
          senderId: socket.userId,
          senderType: socket.userType,
          message,
          messageType,
          attachments: attachmentUrls,
          timestamp: new Date(),
          isRead: false,
          isDeleted: false,
        });

        await newMessage.save();
        console.log("Message saved to database:", newMessage._id);

        // Update conversation's last message
        const lastMessagePreview = message || `${attachments.length} file(s)`;
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: lastMessagePreview,
          lastMessageTime: new Date(),
          $inc: { unreadCount: 1 },
        });

        // Emit message to all users in the conversation
        console.log(`Emitting new message to conversation ${conversationId}:`, {
          messageId: newMessage._id,
          senderId: newMessage.senderId,
          senderType: newMessage.senderType,
          message: newMessage.message,
          
        });
        
        const roomName = `conversation_${conversationId}`;
        console.log(`Emitting to room: ${roomName}`);
        console.log(`Users in room:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
        
        const mappedAttachments = (newMessage.attachments ?? []).map((url: string) => {
          const fileName = url.split('/').pop() || 'file';
          const lower = url.toLowerCase();
          const isImage = [".png", ".jpg", ".jpeg", ".gif", ".webp"].some((ext) => lower.endsWith(ext));
          return {
            fileName,
            originalName: fileName,
            fileType: isImage ? "image" : "document",
            mimeType: isImage ? "image/jpeg" : "application/octet-stream",
            fileSize: 0,
            filePath: url,
            uploadedAt: newMessage.timestamp,
          };
        });

        io.to(roomName).emit("new_message", {
          message: {
            id: newMessage._id.toString(),
            conversationId: newMessage.conversationId,
            senderId: newMessage.senderId,
            senderType: newMessage.senderType,
            message: newMessage.message,
            messageType: newMessage.messageType,
            timestamp: newMessage.timestamp,
            isRead: newMessage.isRead,
            isDeleted: newMessage.isDeleted,
            attachments: mappedAttachments,
          },
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

    // Handle message actions (delete, restore, permanent delete)
    socket.on("message_action", async (data: MessageActionData) => {
      try {
        console.log("Received message_action event:", data);
        const { messageId, conversationId, action } = data;

        // Verify the message belongs to the user
        const message = await ChatMessage.findById(messageId);
        if (!message || message.senderId !== socket.userId) {
          socket.emit("message_error", { error: "Unauthorized action" });
          return;
        }

        let updatedMessage;
        switch (action) {
          case "delete":
            updatedMessage = await ChatMessage.findByIdAndUpdate(
              messageId,
              { 
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: socket.userId
              },
              { new: true }
            );
            break;
          
          case "restore":
            updatedMessage = await ChatMessage.findByIdAndUpdate(
              messageId,
              { 
                isDeleted: false,
                $unset: { deletedAt: 1, deletedBy: 1 }
              },
              { new: true }
            );
            break;
          
          case "permanent_delete":
            await ChatMessage.findByIdAndDelete(messageId);
            updatedMessage = null;
            break;
        }

        const roomName = `conversation_${conversationId}`;
        
        if (action === "permanent_delete") {
          // Emit permanent deletion event
          io.to(roomName).emit("message_permanently_deleted", {
            messageId,
            conversationId,
            deletedBy: socket.userId,
          });
        } else if (updatedMessage) {
          // Emit message update event
          const mappedAttachments2 = (updatedMessage.attachments ?? []).map((url: string) => {
            const fileName = url.split('/').pop() || 'file';
            const lower = url.toLowerCase();
            const isImage = [".png", ".jpg", ".jpeg", ".gif", ".webp"].some((ext) => lower.endsWith(ext));
            return {
              fileName,
              originalName: fileName,
              fileType: isImage ? "image" : "document",
              mimeType: isImage ? "image/jpeg" : "application/octet-stream",
              fileSize: 0,
              filePath: url,
              uploadedAt: updatedMessage.timestamp,
            };
          });

          io.to(roomName).emit("message_updated", {
            message: {
              id: updatedMessage._id.toString(),
              conversationId: updatedMessage.conversationId,
              senderId: updatedMessage.senderId,
              senderType: updatedMessage.senderType,
              message: updatedMessage.message,
              messageType: updatedMessage.messageType,
              timestamp: updatedMessage.timestamp,
              isRead: updatedMessage.isRead,
              isDeleted: updatedMessage.isDeleted,
              deletedAt: updatedMessage.deletedAt,
              deletedBy: updatedMessage.deletedBy,
              attachments: mappedAttachments2,
            },
            action,
            conversationId,
          });
        }

      } catch (error) {
        console.error("Error handling message action:", error);
        socket.emit("message_error", { error: "Failed to perform action" });
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

        // Mark messages as read in database (only non-deleted messages)
        await ChatMessage.updateMany(
          { 
            _id: { $in: messageIds },
            isDeleted: false
          },
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
          readBy: socket.userId,
        });

      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // Handle file upload progress (for real-time progress updates)
    socket.on("file_upload_progress", (data: { conversationId: string, progress: number, fileName: string }) => {
      const roomName = `conversation_${data.conversationId}`;
      socket.to(roomName).emit("file_upload_progress", {
        ...data,
        uploaderId: socket.userId,
        uploaderType: socket.userType,
      });
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