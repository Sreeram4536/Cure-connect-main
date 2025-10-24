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
  
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
      
      console.log('Socket auth - Token received:', !!token);
      
      if (!token) {
        console.log('Socket auth - No token provided');
        return next(new Error("Authentication error"));
      }

      if (!process.env.JWT_SECRET) {
        console.log('Socket auth - JWT_SECRET not configured');
        return next(new Error("Authentication error"));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
        console.log('Socket auth - Token verified for user:', decoded.id, 'role:', decoded.role);
        
        socket.userId = decoded.id; 
        socket.userType = decoded.role; 
        
        next();
      } catch (jwtError: any) {
        console.log('Socket auth - JWT verification failed:', jwtError.name);
        if (jwtError.name === 'TokenExpiredError') {
          console.log('Socket auth - Token expired, checking payload');
          if (jwtError.payload) {
            socket.userId = jwtError.payload.id;
            socket.userType = jwtError.payload.role;
            console.log('Socket auth - Using expired token payload');
            next();
          } else {
            console.log('Socket auth - No payload in expired token');
            next(new Error("Authentication error"));
          }
        } else {
          console.log('Socket auth - JWT error:', jwtError.message);
          next(new Error("Authentication error"));
        }
      }
    } catch (error) {
      console.log('Socket auth - Unexpected error:', error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    

    
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
    }

    
    socket.on("join_conversation", (data: JoinConversationData) => {
      const { conversationId } = data;
      const roomName = `conversation_${conversationId}`;
      socket.join(roomName);
      
    });

    
    socket.on("leave_conversation", (data: JoinConversationData) => {
      const { conversationId } = data;
      socket.leave(`conversation_${conversationId}`);
      
    });

    
    socket.on("send_message", async (data: MessageData) => {
      try {
        console.log("Received send_message event:", data);
        const { conversationId, message, messageType = "text", attachments = [] } = data;

        console.log(`Processing message from ${socket.userType} ${socket.userId} to conversation ${conversationId}`);

        
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

        
        const lastMessagePreview = message || `${attachments.length} file(s)`;
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: lastMessagePreview,
          lastMessageTime: new Date(),
          $inc: { unreadCount: 1 },
        });

        
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
        const roomName = `conversation_${conversationId}`;
        
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
            // Emit to specific conversation room instead of all clients
            io.to(roomName).emit("message deleted", { messageId: messageId });
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

    // socket.on("call_invite", async (data: { conversationId: string; offer: any; targetId?: string; targetType?: "user" | "doctor";appointmentId?: string | null; userId?:string|null}) => {
    //   try {
    //     const roomName = `conversation_${data.conversationId}`;

    //     // Emit to conversation room (for peers already in room)
    //     socket.to(roomName).emit("call_invite", {
    //       fromId: socket.userId,
    //       fromType: socket.userType,
    //       conversationId: data.conversationId,
    //       offer: data.offer,
    //       appointmentId: data.appointmentId || null,
    //       userId:data.userId,
    //     });

        
    //     const convo = await Conversation.findById(data.conversationId).lean();
    //     if (convo) {
    //       const explicitTargetId = data.targetId;
    //       const targetId = explicitTargetId || (socket.userType === "user" ? convo.doctorId : convo.userId);
    //       if (targetId) {
    //         io.to(`user_${targetId}`).emit("call_invite", {
    //           fromId: socket.userId,
    //           fromType: socket.userType,
    //           conversationId: data.conversationId,
    //           offer: data.offer,
    //            appointmentId: data.appointmentId || null,
    //            userId:data.userId,
    //         });
    //       }
    //     }
    //   } catch (error) {
    //     console.error("Error in call_invite:", error);
    //   }
    // });

    socket.on("call_invite", async (data: { conversationId: string; offer: any; targetId?: string; targetType?: "user" | "doctor"; appointmentId?: string | null; userId?: string | null }) => {
  try {
    console.log(" Received from client:", data);

    const roomName = `conversation_${data.conversationId}`;

    socket.to(roomName).emit("call_invite", {
      fromId: socket.userId,
      fromType: socket.userType,
      conversationId: data.conversationId,
      offer: data.offer,
      appointmentId: data.appointmentId || null,
      userId: data.userId || null,
    });

    

    console.log("➡️ [call_invite] Emitted to room:", roomName, {
      appointmentId: data.appointmentId,
      userId: data.userId,
    });

    const convo = await Conversation.findById(data.conversationId).lean();
    if (convo) {
      const explicitTargetId = data.targetId;
      const targetId = explicitTargetId || (socket.userType === "user" ? convo.doctorId : convo.userId);
      if (targetId) {
        const payload = {
          fromId: socket.userId,
          fromType: socket.userType,
          conversationId: data.conversationId,
          offer: data.offer,
          appointmentId: data.appointmentId || null,
          userId: data.userId || null,
        };

        console.log("➡️ [call_invite] Emitted to user socket:", `user_${targetId}`, payload);
        
        io.to(`user_${targetId}`).emit("call_invite", payload);
      }
    }
  } catch (error) {
    console.error("❌ Error in call_invite:", error);
  }
});


   
    // socket.on("call_answer", (data: { conversationId: string; answer: any }) => {
    //   try {
    //     const roomName = `conversation_${data.conversationId}`;
    //     socket.to(roomName).emit("call_answer", {
    //       fromId: socket.userId,
    //       fromType: socket.userType,
    //       conversationId: data.conversationId,
    //       answer: data.answer,
    //     });
    //   } catch (error) {
    //     console.error("Error in call_answer:", error);
    //   }
    // });

//     socket.on("call_answer", (data: { conversationId: string; answer: any; appointmentId?: string; userId?: string }) => {
//   try {
//     const roomName = `conversation_${data.conversationId}`;
//     socket.to(roomName).emit("call_answer", {
//       fromId: socket.userId,
//       fromType: socket.userType,
//       conversationId: data.conversationId,
//       answer: data.answer,
//       appointmentId: data.appointmentId || null,
//       userId: data.userId || null,
//     });
//   } catch (error) {
//     console.error("Error in call_answer:", error);
//   }
// });

socket.on("call_answer", (data: { conversationId: string; answer: any; appointmentId?: string; userId?: string }) => {
  try {
    console.log(" Received from client:", data);

    const roomName = `conversation_${data.conversationId}`;
    const payload = {
      fromId: socket.userId,
      fromType: socket.userType,
      conversationId: data.conversationId,
      answer: data.answer,
      appointmentId: data.appointmentId || null,
      userId: data.userId || null,
    };

    console.log("[call_answer] Emitted to room:", roomName, payload);

    socket.to(roomName).emit("call_answer", payload);
  } catch (error) {
    console.error(" Error in call_answer:", error);
  }
});



    
    socket.on("call_candidate", (data: { conversationId: string; candidate: any }) => {
      try {
        const roomName = `conversation_${data.conversationId}`;
        socket.to(roomName).emit("call_candidate", {
          fromId: socket.userId,
          fromType: socket.userType,
          conversationId: data.conversationId,
          candidate: data.candidate,
        });
      } catch (error) {
        console.error("Error in call_candidate:", error);
      }
    });

    
    socket.on("call_end", (data: { conversationId: string; reason?: string }) => {
      try {
        const roomName = `conversation_${data.conversationId}`;
        io.to(roomName).emit("call_end", {
          fromId: socket.userId,
          fromType: socket.userType,
          conversationId: data.conversationId,
          reason: data.reason ?? "ended",
        });
      } catch (error) {
        console.error("Error in call_end:", error);
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