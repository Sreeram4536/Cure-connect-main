import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getConversationAPI,
  getMessagesAPI,
  sendMessageAPI,
  markConversationAsReadAPI,
  createConversationAPI,
  sendMessageWithFilesAPI,
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
  const { socket, isConnected, joinConversation, leaveConversation, sendMessage, startTyping, stopTyping, markAsRead, deleteMessage } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [tempMessage, setTempMessage] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showFilePreview, setShowFilePreview] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
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

    // Listen for message deletion
    socket.on('message_deleted', (data: { messageId: string; conversationId: string; deletedBy: string }) => {
      if (conversation && data.conversationId === conversation.id) {
        console.log('Message deleted:', data.messageId);
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      }
    });

    // Listen for deletion errors
    socket.on('delete_error', (data: { error: string }) => {
      console.error('Delete error:', data.error);
      toast.error(data.error);
    });

    return () => {
      socket.off('new_message');
      socket.off('typing_start');
      socket.off('typing_stopped');
      socket.off('messages_read');
      socket.off('message_deleted');
      socket.off('delete_error');
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

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      const isValidType = file.type.startsWith('image/') || 
                         file.type === 'application/pdf' ||
                         file.type.startsWith('text/') ||
                         file.type.includes('document');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!isValidType) {
        toast.error(`${file.name} is not a supported file type`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    if (validFiles.length > 0) {
      setShowFilePreview(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length === 1) {
      setShowFilePreview(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if ((newMessage.trim() === "" && selectedFiles.length === 0) || !conversation) return;

    setIsSending(true);
    try {
      console.log("Sending message:", newMessage.trim(), "to conversation:", conversation.id);
      
      // If files are selected, send with files
      if (selectedFiles.length > 0) {
        const response = await sendMessageWithFilesAPI(
          conversation.id,
          newMessage.trim() || "Sent a file",
          selectedFiles
        );
        
        if (response.data.success) {
          setMessages((prev) => [...prev, response.data.message]);
          setNewMessage("");
          setSelectedFiles([]);
          setShowFilePreview(false);
        }
      } else {
        // Send text message via Socket.IO for real-time delivery
        if (isConnected) {
          // Add temporary message to show it's being sent
          const tempMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            conversationId: conversation.id,
            senderId: "user",
            senderType: "user" as const,
            message: newMessage.trim(),
            messageType: "text",
            timestamp: new Date(),
            isRead: false,
            attachments: []
          };
          setMessages(prev => [...prev, tempMsg]);
          setTempMessage(newMessage.trim());
          
          sendMessage(conversation.id, newMessage.trim(), "text");
          setNewMessage("");
        } else {
          // Fallback to REST API if socket is not connected
          const response = await sendMessageAPI(
            conversation.id,
            newMessage.trim(),
            "text"
          );
          console.log("Send message response:", response.data);

          if (response.data.success) {
            setMessages((prev) => [...prev, response.data.message]);
            setNewMessage("");
          }
        }
      }
      setIsSending(false);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!conversation) return;
    
    try {
      if (isConnected) {
        // Delete via socket for real-time updates
        deleteMessage(messageId, conversation.id);
      } else {
        // Fallback to REST API
        await deleteMessageAPI(messageId);
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast.success("Message deleted");
      }
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
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
                      {message.senderType === "doctor" && (
                        <img
                          src={doctor?.avatar || "https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=40&h=40&fit=crop&crop=face"}
                          alt="Doctor Avatar"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div className="relative">
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            message.senderType === "user"
                              ? "bg-blue-500 text-white rounded-br-sm"
                              : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                          }`}
                        >
                          {/* Message content based on type */}
                          {message.messageType === "image" && message.attachments?.length ? (
                            <div className="space-y-2">
                              {message.attachments.map((attachment, index) => (
                                <img
                                  key={index}
                                  src={`http://localhost:4000${attachment}`}
                                  alt="Shared image"
                                  className="max-w-full h-auto rounded-lg cursor-pointer"
                                  onClick={() => window.open(`http://localhost:4000${attachment}`, '_blank')}
                                />
                              ))}
                              {message.message && message.message !== "Sent a file" && (
                                <p className="text-sm mt-2">{message.message}</p>
                              )}
                            </div>
                          ) : message.messageType === "file" && message.attachments?.length ? (
                            <div className="space-y-2">
                              {message.attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
                                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <a
                                    href={`http://localhost:4000${attachment}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    {attachment.split('/').pop()}
                                  </a>
                                </div>
                              ))}
                              {message.message && message.message !== "Sent a file" && (
                                <p className="text-sm mt-2">{message.message}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm">{message.message}</p>
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
                        
                        {/* Delete button for user's own messages */}
                        {message.senderType === "user" && !message.id.startsWith('temp-') && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            title="Delete message"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
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

            {/* File Preview */}
            {showFilePreview && selectedFiles.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedFiles.length} file(s) selected
                  </span>
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      setShowFilePreview(false);
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center bg-white rounded-lg p-2 border">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-8 h-8 object-cover rounded mr-2"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      <span className="text-sm text-gray-700 truncate max-w-32">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div 
              className={`bg-white border-t border-gray-200 px-6 py-4 ${
                dragActive ? 'bg-blue-50 border-blue-300' : ''
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  multiple
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Attach files"
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
                    placeholder={dragActive ? "Drop files here..." : "Type a message..."}
                    disabled={isSending}
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={(newMessage.trim() === "" && selectedFiles.length === 0) || isSending}
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
              
              {dragActive && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-50 flex items-center justify-center border-2 border-dashed border-blue-300 rounded-lg">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-blue-700 font-medium">Drop files here to upload</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
