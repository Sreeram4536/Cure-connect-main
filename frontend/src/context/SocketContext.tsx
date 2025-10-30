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
  // WebRTC signaling helpers
  sendCallInvite: (conversationId: string, offer: any,target:any,appointmentId:string|null,userId:string | null) => void;
  sendCallAnswer: (conversationId: string, answer: any,apptId:string|null,uId:string|null) => void;
  sendCallCandidate: (conversationId: string, candidate: any) => void;
  sendCallEnd: (conversationId: string, reason?: string) => void;
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
      // If already connected or connecting, don't try again
      if (socket?.connected) {
        console.log('Socket is already connected');
        return;
      }

      if (socket) {
        console.log('Cleaning up existing socket connection');
        socket.disconnect();
        setSocket(null);
      }

      console.log('Socket connection - Starting connection process...');
      console.log('Socket connection - Environment check:', {
        VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
        NODE_ENV: import.meta.env.NODE_ENV
      });

      const token = await getValidToken();
      
      console.log('Socket connection - Token found:', !!token);
      if (token) {
        console.log('Socket connection - Token length:', token.length);
        console.log('Socket connection - Token starts with:', token.substring(0, 20) + '...');
        
        // Decode token to show role information
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('Socket connection - User role:', payload.role);
          console.log('Socket connection - User ID:', payload.id);
        } catch (e) {
          console.log('Socket connection - Could not decode token for debugging');
        }
      }
      
      if (!token) {
        console.log('No valid token found, skipping socket connection');
        return;
      }


      // Get backend URL from environment or use default
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      console.log('Socket connecting to:', backendUrl);
      
      // Validate backend URL
      if (!backendUrl || backendUrl === 'undefined') {
        console.error('Invalid backend URL:', backendUrl);
        toast.error('Invalid server configuration');
        return;
      }
      
      const newSocket = io(backendUrl, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'], 
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        setIsConnected(true);
        setRetryCount(0);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          setTimeout(() => {
            connect();
          }, 1000);
        }
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        setRetryCount(0);
      });

      newSocket.on('reconnect_error', (error) => {
        console.log('Socket reconnection error:', error);
      });

      newSocket.on('connect_error', async (error) => {
        console.error('Socket connection error:', error);
        
       
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

      // Remove global call_invite UI handling. Doctor-specific UI handled in DoctorLayout.

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

  // ---------------------------
  // WebRTC signaling emitters
  // ---------------------------
  const sendCallInvite = (conversationId: string, offer: any, target?: { id: string; type: 'user' | 'doctor' },appointmentId?: string|null,userId?:string|null) => {
    if (socket && isConnected) {
      socket.emit('call_invite', { conversationId, offer, targetId: target?.id, targetType: target?.type,appointmentId,userId });
    }
  };

  // const sendCallAnswer = (conversationId: string, answer: any) => {
  //   if (socket && isConnected) {
  //     socket.emit('call_answer', { conversationId, answer });
  //   }
  // };

  const sendCallAnswer = (
  conversationId: string,
  answer: any,
  appointmentId?: string | null,
  userId?: string | null
) => {
  if (socket && isConnected) {
    socket.emit("call_answer", { conversationId, answer, appointmentId, userId });
  }
};


  const sendCallCandidate = (conversationId: string, candidate: any) => {
    if (socket && isConnected) {
      socket.emit('call_candidate', { conversationId, candidate });
    }
  };

  const sendCallEnd = (conversationId: string, reason?: string) => {
    if (socket && isConnected) {
      socket.emit('call_end', { conversationId, reason });
    }
  };

  useEffect(() => {
    let connectionTimer: NodeJS.Timeout;
    let retryTimer: NodeJS.Timeout;

    const attemptConnection = async () => {
      try {
        // First check if token exists
        const token = await getValidToken();
        if (!token) {
          console.log('No token available, retrying in 2 seconds...');
          retryTimer = setTimeout(attemptConnection, 2000);
          return;
        }

        // Token exists, attempt socket connection with a delay
        console.log('Token found, initiating socket connection...');
        connectionTimer = setTimeout(() => {
          connect();
        }, 2000);

      } catch (error) {
        console.error('Error in connection attempt:', error);
        retryTimer = setTimeout(attemptConnection, 2000);
      }
    };

    // Start the connection attempt process
    attemptConnection();

    // Cleanup on unmount
    return () => {
      if (connectionTimer) clearTimeout(connectionTimer);
      if (retryTimer) clearTimeout(retryTimer);
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
    sendCallInvite,
    sendCallAnswer,
    sendCallCandidate,
    sendCallEnd,
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