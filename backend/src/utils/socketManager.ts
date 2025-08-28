import { Server } from "socket.io";

let ioInstance: Server | null = null;

export function setIO(io: Server) {
  ioInstance = io;
}

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error("Socket.io instance not initialized");
  }
  return ioInstance;
}

export function emitToConversation(conversationId: string, event: string, payload: unknown) {
  if (!ioInstance) return;
  const room = `conversation_${conversationId}`;
  ioInstance.to(room).emit(event, payload);
}
