import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getConversationAPI,
  getMessagesAPI,
  sendMessageAPI,
  markConversationAsReadAPI,
  createConversationAPI,
  uploadChatFilesAPI,
  deleteMessageAPI,
} from "../../services/chatServices";
import { useSocket } from "../../context/SocketContext";
import type { ChatMessage, Conversation } from "../../types/chat";
import SocketStatus from "../../components/common/SocketStatus";

interface Doctor {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
  specialization?: string;
}

const ChatPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const { socket, isConnected, joinConversation, leaveConversation, sendMessage, startTyping, stopTyping, markAsRead } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [tempMessage, setTempMessage] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
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
      console.log('User received new message:', data);
      console.log('Current conversation ID:', conversation?.id);
      console.log('Message conversation ID:', data.conversationId);
      console.log('Messages match:', conversation && data.conversationId === conversation.id);
      
      if (conversation && data.conversationId === conversation.id) {
        console.log('Adding new message to user chat');
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
      if (data.userType === 'doctor') {
        setIsTyping(true);
      }
    });

    socket.on('typing_stopped', (data: { userId: string; userType: string }) => {
      if (data.userType === 'doctor') {
        setIsTyping(false);
      }
    });

    // Listen for message read status
    socket.on('messages_read', (data: { messageIds: string[]; conversationId: string }) => {
      if (conversation && data.conversationId === conversation.id) {
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
  }, [socket, conversation]);

  useEffect(() => {
    console.log("ChatPage received doctorId:", doctorId);
    if (doctorId) {
      loadConversation();
    }
  }, [doctorId]);

  // Auto-join conversation when socket connects
  useEffect(() => {
    if (isConnected && conversation) {
      console.log("Socket connected, joining conversation:", conversation.id);
      joinConversation(conversation.id);
    }
  }, [isConnected, conversation]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  const loadConversation = async () => {
    if (!doctorId) return;

    try {
      setIsLoading(true);
      console.log("Loading conversation for doctorId:", doctorId);
      const response = await getConversationAPI(doctorId);
      console.log("Conversation response:", response.data);
      if (response.data.success) {
        setConversation(response.data.conversation);
        setDoctor(response.data.doctor);
        
        // If conversation exists, load messages and join socket room
        if (response.data.conversation) {
          console.log("Loading messages for conversation:", response.data.conversation.id);
          await loadMessages(response.data.conversation.id);
          
          // Join socket conversation room
          if (isConnected) {
            joinConversation(response.data.conversation.id);
          } else {
            console.log("Socket not connected, will join when connected");
            // Retry joining when socket connects
            const checkConnection = setInterval(() => {
              if (isConnected) {
                joinConversation(response.data.conversation.id);
                clearInterval(checkConnection);
              }
            }, 1000);
            // Clear interval after 10 seconds
            setTimeout(() => clearInterval(checkConnection), 10000);
          }
          
          // Mark conversation as read when opened
          console.log("Marking conversation as read:", response.data.conversation.id);
          try {
            await markConversationAsReadAPI(response.data.conversation.id);
            // Mark messages as read via socket
            const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderType === 'doctor');
            if (unreadMessages.length > 0) {
              markAsRead(response.data.conversation.id, unreadMessages.map(msg => msg.id));
            }
          } catch (error) {
            console.error("Error marking conversation as read:", error);
          }
        } else {
          console.log("No conversation found, creating new one");
          // If no conversation exists, create one
          await createConversation();
        }
      }
    } catch (error: any) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = async () => {
    if (!doctorId) return;

    try {
      const response = await createConversationAPI(doctorId);
      if (response.data.success) {
        setConversation(response.data.conversation);
        
        // Join socket conversation room
        if (isConnected) {
          joinConversation(response.data.conversation.id);
        } else {
          console.log("Socket not connected, will join when connected");
          // Retry joining when socket connects
          const checkConnection = setInterval(() => {
            if (isConnected) {
              joinConversation(response.data.conversation.id);
              clearInterval(checkConnection);
            }
          }, 1000);
          // Clear interval after 10 seconds
          setTimeout(() => clearInterval(checkConnection), 10000);
        }
        
        toast.success("Chat started successfully!");
      }
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to start chat");
    }
  };

  const loadMessages = async (conversationId?: string) => {
    if (!conversationId) return;

    try {
      console.log("Loading messages for conversationId:", conversationId);
      const response = await getMessagesAPI(conversationId, 1, 50);
      console.log("Messages response:", response.data);
      if (response.data.success) {
        setMessages(response.data.messages.reverse()); // Reverse to show oldest first
      }
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleFileUpload = async (): Promise<string[]> => {
    if (!selectedFiles) return [];

    setIsUploading(true);
    try {
      const response = await uploadChatFilesAPI(selectedFiles);
      if (response.data.success) {
        return response.data.attachments.map((att: any) => att.path);
      }
      return [];
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if ((newMessage.trim() === "" && !selectedFiles) || !conversation) return;

    setIsSending(true);
    try {
      console.log("Sending message:", newMessage.trim(), "to conversation:", conversation.id);
      
      // Upload files first if any are selected
      let attachments: string[] = [];
      if (selectedFiles) {
        attachments = await handleFileUpload();
      }

      const messageText = newMessage.trim() || (attachments.length > 0 ? "📎 File attachment" : "");
      const messageType = attachments.length > 0 ? "file" : "text";
      
      // Send message via Socket.IO for real-time delivery
      if (isConnected) {
        // Add temporary message to show it's being sent
        const tempMsg: ChatMessage = {
          id: `temp-${Date.now()}`,
          conversationId: conversation.id,
          senderId: "user",
          senderType: "user" as const,
          message: messageText,
          messageType: messageType as any,
          timestamp: new Date(),
          isRead: false,
          attachments: attachments
        };
        setMessages(prev => [...prev, tempMsg]);
        setTempMessage(messageText);
        
        sendMessage(conversation.id, messageText, messageType, attachments);
        setNewMessage("");
        setSelectedFiles(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsSending(false);
      } else {
        // Fallback to REST API if socket is not connected
        const response = await sendMessageAPI(
          conversation.id,
          messageText,
          messageType,
          attachments
        );
        console.log("Send message response:", response.data);

        if (response.data.success) {
          setMessages((prev) => [...prev, response.data.message]);
          setNewMessage("");
          setSelectedFiles(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
        setIsSending(false);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await deleteMessageAPI(messageId);
      if (response.data.success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast.success("Message deleted successfully");
      }
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast.error(error.response?.data?.message || "Failed to delete message");
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

  if (!doctorId || !conversation) {
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
      {/* LEFT SIDEBAR - Doctor Profile */}
      <div className="w-80 h-full flex flex-col items-center justify-center text-center px-4 bg-white border-r border-gray-200 p-6 shadow-md">
        <img
          src={doctor?.avatar || "https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=100&h=100&fit=crop&crop=face"}
          alt={doctor?.name || "Doctor"}
          className="w-32 h-32 rounded-full object-cover shadow-lg mb-4"
        />
        <h2 className="text-xl font-semibold text-gray-800">{doctor?.name || "Doctor"}</h2>
        <p className="text-sm text-gray-500">{doctor?.specialization || "Specialist"}</p>
        <p className="mt-2 text-xs text-green-600">
          {doctor?.isOnline ? "Online" : `Last seen ${doctor?.lastSeen || "recently"}`}
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
                    src={doctor?.avatar || "https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=40&h=40&fit=crop&crop=face"}
                    alt={doctor?.name || "Doctor"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {doctor?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {doctor?.name || "Doctor"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {doctor?.isOnline
                      ? "Online"
                      : `Last seen ${doctor?.lastSeen || "recently"}`}
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
                      message.senderType === "user" ? "justify-end" : "justify-start"
                    } group`}
                  >
                    <div
                      className={`flex max-w-xs lg:max-w-md ${
                        message.senderType === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      } items-end space-x-2`}
                    >
                      {/* Delete button for user messages */}
                      {message.senderType === "user" && !message.id.startsWith('temp-') && (
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-400 hover:text-red-600 rounded"
                          title="Delete message"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      {message.senderType === "doctor" && (
                        <img
                          src={doctor?.avatar || "https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=40&h=40&fit=crop&crop=face"}
                          alt="Doctor Avatar"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          message.senderType === "user"
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        
                        {/* Render attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <a
                                  href={`http://localhost:4000${attachment}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-xs underline ${
                                    message.senderType === "user"
                                      ? "text-blue-100 hover:text-white"
                                      : "text-blue-600 hover:text-blue-800"
                                  }`}
                                >
                                  📎 {attachment.split('/').pop()}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <p
                          className={`text-xs mt-1 ${
                            message.senderType === "user"
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
                      src={doctor?.avatar || "https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=40&h=40&fit=crop&crop=face"}
                      alt="Doctor Avatar"
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
              {/* File Preview */}
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFiles(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {Array.from(selectedFiles).map((file, index) => (
                      <div key={index} className="text-xs text-gray-500 truncate">
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
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
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                  )}
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      
                      // Handle typing indicators
                      if (isConnected && conversation) {
                        // Clear existing timeout
                        if (typingTimeout) {
                          clearTimeout(typingTimeout);
                        }
                        
                        // Start typing indicator
                        startTyping(conversation.id);
                        
                        // Set timeout to stop typing indicator
                        const timeout = setTimeout(() => {
                          stopTyping(conversation.id);
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
                  disabled={(newMessage.trim() === "" && !selectedFiles) || isSending || isUploading}
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

export default ChatPage;
