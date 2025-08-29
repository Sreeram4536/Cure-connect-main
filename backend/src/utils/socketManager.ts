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
  if (!ioInstance) {
    console.log('SocketManager: No IO instance available');
    return;
  }
  const room = `conversation_${conversationId}`;
  console.log(`SocketManager: Emitting ${event} to room ${room} with payload:`, payload);
  ioInstance.to(room).emit(event, payload);
}
