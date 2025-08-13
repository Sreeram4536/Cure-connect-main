import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getDoctorConversationsAPI,
  getMessagesAPI,
  sendDoctorMessageAPI,
  markConversationAsReadAPI,
  getDoctorConversationWithUserAPI,
  sendDoctorMessageWithFilesAPI,
} from "../../services/chatServices";
import { useSocket } from "../../context/SocketContext";
import type { ChatMessage, Conversation } from "../../types/chat";
import SocketStatus from "../../components/common/SocketStatus";

interface User {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
}

const DocChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { socket, isConnected, joinConversation, leaveConversation, sendMessage, startTyping, stopTyping, markAsRead } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [tempMessage, setTempMessage] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [showFilePreview, setShowFilePreview] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('new_message', (data: { message: ChatMessage; conversationId: string }) => {
      console.log('Doctor received new message:', data);
      console.log('Current conversation ID:', conversationId);
      console.log('Message conversation ID:', data.conversationId);
      console.log('Messages match:', conversationId && data.conversationId === conversationId);
      
      if (conversationId && data.conversationId === conversationId) {
        console.log('Adding new message to doctor chat');
        setMessages(prev => {
          // Remove any temporary messages and add the real message
          const filteredMessages = prev.filter(msg => !msg.id.startsWith('temp-'));
          const newMessages = [...filteredMessages, data.message];
          console.log('Updated messages count:', newMessages.length);
          return newMessages;
        });
        // Auto-scroll to bottom when new message arrives
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        console.log('Message not for current conversation or no conversation loaded');
      }
    });

    // Listen for typing indicators
    socket.on('typing_start', (data: { userId: string; userType: string }) => {
      if (data.userType === 'user') {
        setIsTyping(true);
      }
    });

    socket.on('typing_stopped', (data: { userId: string; userType: string }) => {
      if (data.userType === 'user') {
        setIsTyping(false);
      }
    });

    // Listen for message read status
    socket.on('messages_read', (data: { messageIds: string[]; conversationId: string }) => {
      if (conversationId && data.conversationId === conversationId) {
        setMessages(prev => 
          prev.map(msg => 
            data.messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
          )
        );
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('typing_start');
      socket.off('typing_stopped');
      socket.off('messages_read');
    };
  }, [socket, conversationId]);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  // Auto-join conversation when socket connects
  useEffect(() => {
    if (isConnected && conversationId) {
      console.log("Socket connected, joining conversation:", conversationId);
      joinConversation(conversationId);
    }
  }, [isConnected, conversationId]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  const loadConversation = async () => {
    if (!conversationId) return;

    try {
      setIsLoading(true);
      console.log("Loading conversation for conversationId:", conversationId);
      const response = await getDoctorConversationWithUserAPI(conversationId);
      console.log("Doctor conversation response:", response.data);
      if (response.data.success) {
        setConversation(response.data.conversation);
        setUser(response.data.user);
        
        // Load messages for this conversation
        await loadMessages();
        
        // Join socket conversation room
        if (isConnected) {
          joinConversation(conversationId);
        } else {
          console.log("Socket not connected, will join when connected");
          // Retry joining when socket connects
          const checkConnection = setInterval(() => {
            if (isConnected) {
              joinConversation(conversationId);
              clearInterval(checkConnection);
            }
          }, 1000);
          // Clear interval after 10 seconds
          setTimeout(() => clearInterval(checkConnection), 10000);
        }
        
        // Mark conversation as read when opened
        try {
          await markConversationAsReadAPI(conversationId);
          // Mark messages as read via socket
          const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderType === 'user');
          if (unreadMessages.length > 0) {
            markAsRead(conversationId, unreadMessages.map(msg => msg.id));
          }
        } catch (error) {
          console.error("Error marking conversation as read:", error);
        }
      }
    } catch (error: any) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    try {
      console.log("Loading messages for conversationId:", conversationId);
      const response = await getMessagesAPI(conversationId, 1, 50);
      console.log("Doctor messages response:", response.data);
      if (response.data.success) {
        setMessages(response.data.messages.reverse()); // Reverse to show oldest first
      }
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const handleSendMessage = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !conversationId) return;

    setIsSending(true);
    try {
      console.log("Doctor sending message:", newMessage.trim(), "to conversation:", conversationId);
      
      // Send message via Socket.IO for real-time delivery
      if (isConnected) {
        // Add temporary message to show it's being sent
        const tempMsg: ChatMessage = {
          id: `temp-${Date.now()}`,
          conversationId: conversationId,
          senderId: "doctor",
          senderType: "doctor" as const,
          message: newMessage.trim(),
          messageType: "text",
          timestamp: new Date(),
          isRead: false,
          attachments: []
        };
        setMessages(prev => [...prev, tempMsg]);
        setTempMessage(newMessage.trim());
        
        sendMessage(conversationId, newMessage.trim(), "text");
        setNewMessage("");
        setIsSending(false);
      } else {
        // Fallback to REST API if socket is not connected
        const response = await sendDoctorMessageAPI(
          conversationId,
          newMessage.trim(),
          "text"
        );
        console.log("Doctor send message response:", response.data);

        if (response.data.success) {
          setMessages((prev) => [...prev, response.data.message]);
          setNewMessage("");
        }
        setIsSending(false);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setIsSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
      setShowFilePreview(true);
    }
  };

  const handleRemoveFile = (index: number) => {
    if (selectedFiles) {
      const dt = new DataTransfer();
      for (let i = 0; i < selectedFiles.length; i++) {
        if (i !== index) {
          dt.items.add(selectedFiles[i]);
        }
      }
      setSelectedFiles(dt.files);
      if (dt.files.length === 0) {
        setShowFilePreview(false);
      }
    }
  };

  const handleSendWithFiles = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!conversationId || (!newMessage.trim() && !selectedFiles)) return;

    setIsSending(true);
    try {
      if (selectedFiles && selectedFiles.length > 0) {
        // Send message with files
        const response = await sendDoctorMessageWithFilesAPI(
          conversationId,
          newMessage.trim(),
          selectedFiles
        );
        
        if (response.data.success) {
          setMessages((prev) => [...prev, response.data.data]);
          setNewMessage("");
          setSelectedFiles(null);
          setShowFilePreview(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } else {
        // Send regular text message
        await handleSendMessage(e);
      }
    } catch (error: any) {
      console.error("Error sending message with files:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!conversationId || !user) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chat Not Found</h2>
          <p className="text-gray-600">The chat you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SocketStatus />
      {/* LEFT SIDEBAR - User Profile */}
      <div className="w-80 h-full flex flex-col items-center justify-center text-center px-4 bg-white border-r border-gray-200 p-6 shadow-md">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-32 h-32 rounded-full object-cover shadow-lg mb-4"
        />
        <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
        <p className="text-sm text-gray-500">Patient</p>
        <p className="mt-2 text-xs text-green-600">
          {user.isOnline ? "Online" : `Last seen ${user.lastSeen}`}
        </p>
      </div>

      {/* RIGHT SIDE - Chat Area */}
      <div className="flex flex-col flex-1">
        <div className="flex flex-col h-full bg-gray-50">
          <div className="flex flex-col h-screen bg-gray-50">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {user.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {user.isOnline
                      ? "Online"
                      : `Last seen ${user.lastSeen}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderType === "doctor" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-xs lg:max-w-md ${
                        message.senderType === "doctor"
                          ? "flex-row-reverse"
                          : "flex-row"
                      } items-end space-x-2`}
                    >
                      {message.senderType === "user" && (
                        <img
                          src={user.avatar}
                          alt="User Avatar"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          message.senderType === "doctor"
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.senderType === "doctor"
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-end space-x-2">
                    <img
                      src={user.avatar}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      
                      // Handle typing indicators
                      if (isConnected && conversationId) {
                        // Clear existing timeout
                        if (typingTimeout) {
                          clearTimeout(typingTimeout);
                        }
                        
                        // Start typing indicator
                        startTyping(conversationId);
                        
                        // Set timeout to stop typing indicator
                        const timeout = setTimeout(() => {
                          stopTyping(conversationId);
                        }, 2000);
                        
                        setTypingTimeout(timeout);
                      }
                    }}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSendMessage(e)
                    }
                    placeholder="Type a message..."
                    disabled={isSending}
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={newMessage.trim() === "" || isSending}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocChatPage;
