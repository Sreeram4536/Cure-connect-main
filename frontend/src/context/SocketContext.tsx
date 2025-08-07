import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { getValidToken } from '../utils/tokenRefresh';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, message: string, messageType?: string, attachments?: string[]) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  markAsRead: (conversationId: string, messageIds: string[]) => void;
  deleteMessage: (messageId: string, conversationId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

  const connect = async () => {
    try {
      const token = await getValidToken();
      
      console.log('Socket connection - Token found:', !!token);
      if (token) {
        console.log('Socket connection - Token length:', token.length);
        console.log('Socket connection - Token starts with:', token.substring(0, 20) + '...');
      }
      
      if (!token) {
        console.log('No valid token found, skipping socket connection');
        return;
      }

      const newSocket = io('http://localhost:4000', {
        auth: {
          token: token,
        },
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        timeout: 20000,
        forceNew: true,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        setRetryCount(0); // Reset retry count on successful connection
        toast.success('Connected to chat server');
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
        toast.error('Disconnected from chat server');
      });

      newSocket.on('connect_error', async (error) => {
        console.error('Socket connection error:', error);
        
        // If it's an authentication error, try to refresh the token
        if (error.message === 'Authentication error') {
          console.log('Authentication error, attempting token refresh...');
          const newToken = await getValidToken();
          if (newToken) {
            console.log('Token refreshed, reconnecting...');
            setTimeout(() => {
              connect();
            }, 1000);
            return;
          }
        }
        
        // Only show error toast if it's not an authentication error
        if (error.message !== 'Authentication error') {
          if (retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            console.log(`Retrying connection in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              connect();
            }, delay);
          } else {
            toast.error('Failed to connect to chat server after multiple attempts');
          }
        }
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Error connecting to socket:', error);
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  const joinConversation = (conversationId: string) => {
    if (socket && isConnected) {
      console.log(`Joining conversation: ${conversationId}`);
      socket.emit('join_conversation', { conversationId });
    } else {
      console.log(`Cannot join conversation ${conversationId}: socket=${!!socket}, connected=${isConnected}`);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_conversation', { conversationId });
    }
  };

  const sendMessage = (conversationId: string, message: string, messageType: string = 'text', attachments: string[] = []) => {
    if (socket && isConnected) {
      console.log(`Sending message via Socket.IO: ${message} to conversation ${conversationId}`);
      socket.emit('send_message', {
        conversationId,
        message,
        messageType,
        attachments,
      });
    } else {
      console.log(`Cannot send message: socket=${!!socket}, connected=${isConnected}`);
    }
  };

  const startTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { conversationId });
    }
  };

  const stopTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { conversationId });
    }
  };

  const markAsRead = (conversationId: string, messageIds: string[]) => {
    if (socket && isConnected) {
      socket.emit('mark_as_read', { conversationId, messageIds });
    }
  };

  const deleteMessage = (messageId: string, conversationId: string) => {
    if (socket && isConnected) {
      console.log(`Deleting message ${messageId} from conversation ${conversationId}`);
      socket.emit('delete_message', { messageId, conversationId });
    } else {
      console.log(`Cannot delete message: socket=${!!socket}, connected=${isConnected}`);
    }
  };

  useEffect(() => {
    // Auto-connect when component mounts with a small delay
    const timer = setTimeout(() => {
      connect();
    }, 2000); // Increased delay to ensure backend is ready

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, []);

  const value: SocketContextType = {
    socket,
    isConnected,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    deleteMessage,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 