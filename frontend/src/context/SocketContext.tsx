import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { getValidToken } from '../utils/tokenRefresh';
import { AttachmentDTO } from '../types/chat';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, message: string, messageType?: string, attachments?: AttachmentDTO[]) => void;
  sendMessageAction: (messageId: string, conversationId: string, action: "delete" | "restore" | "permanent_delete") => void;
  sendFileUploadProgress: (conversationId: string, progress: number, fileName: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  markAsRead: (conversationId: string, messageIds: string[]) => void;
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

      // Enhanced event listeners for new features
      newSocket.on('new_message', (data) => {
        console.log('Received new message:', data);
        // This will be handled by individual chat components
      });

      newSocket.on('message_updated', (data) => {
        console.log('Message updated:', data);
        // Handle message deletion/restoration
      });

      newSocket.on('message_permanently_deleted', (data) => {
        console.log('Message permanently deleted:', data);
        // Handle permanent message deletion
      });

      newSocket.on('file_upload_progress', (data) => {
        console.log('File upload progress:', data);
        // Handle real-time file upload progress
      });

      newSocket.on('message_error', (data) => {
        console.error('Message error:', data);
        toast.error(data.error || 'An error occurred with your message');
      });

      newSocket.on('typing_start', (data) => {
        console.log('User started typing:', data);
      });

      newSocket.on('typing_stopped', (data) => {
        console.log('User stopped typing:', data);
      });

      newSocket.on('messages_read', (data) => {
        console.log('Messages marked as read:', data);
      });

      newSocket.on('user_status_changed', (data) => {
        console.log('User status changed:', data);
      });

      setSocket(newSocket);

    } catch (error) {
      console.error('Error connecting to socket:', error);
      toast.error('Failed to connect to chat server');
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
      console.log('Joining conversation:', conversationId);
      socket.emit('join_conversation', { conversationId });
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socket && isConnected) {
      console.log('Leaving conversation:', conversationId);
      socket.emit('leave_conversation', { conversationId });
    }
  };

  const sendMessage = (conversationId: string, message: string, messageType: string = "text", attachments: AttachmentDTO[] = []) => {
    if (socket && isConnected) {
      console.log('Sending message via socket:', { conversationId, message, messageType, attachments });
      socket.emit('send_message', {
        conversationId,
        message,
        messageType,
        attachments,
      });
    }
  };

  const sendMessageAction = (messageId: string, conversationId: string, action: "delete" | "restore" | "permanent_delete") => {
    if (socket && isConnected) {
      console.log('Sending message action:', { messageId, conversationId, action });
      socket.emit('message_action', {
        messageId,
        conversationId,
        action,
      });
    }
  };

  const sendFileUploadProgress = (conversationId: string, progress: number, fileName: string) => {
    if (socket && isConnected) {
      socket.emit('file_upload_progress', {
        conversationId,
        progress,
        fileName,
      });
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
      console.log('Marking messages as read:', { conversationId, messageIds });
      socket.emit('mark_as_read', { conversationId, messageIds });
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
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
    sendMessageAction,
    sendFileUploadProgress,
    startTyping,
    stopTyping,
    markAsRead,
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