import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import EmojiPicker from 'emoji-picker-react';
import {
  getConversationAPI,
  getMessagesAPI,
  sendMessageAPI,
  markConversationAsReadAPI,
  createConversationAPI,
  deleteMessageAPI,
} from "../../services/chatServices";

import { api } from "../../axios/axiosInstance";
import { useSocket } from "../../context/SocketContext";
import type { ChatMessage, Conversation } from "../../types/chat";

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
  const navigate = useNavigate();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<string[]>([]);
  const [pendingType, setPendingType] = useState<"image" | "file" | null>(null);

  // New state for emoji picker and reply
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [showReplyPreview, setShowReplyPreview] = useState(false);

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

    socket.on("message deleted", (data: { messageId: string }) => {
      console.log("Received message deleted event:", data);
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    });

    return () => {
      socket.off('new_message');
      socket.off('typing_start');
      socket.off('typing_stopped');
      socket.off('messages_read');
      socket.off('message deleted');
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
        setMessages(response.data.messages.reverse()); 
      }
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    }
  };

  // File upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await api.post("/api/chat/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.url;
      
      let messageType: "image" | "file" = file.type.startsWith("image/") ? "image" : "file";
      setPendingAttachments([url]);
      setPendingType(messageType);
      setNewMessage(messageType === "image" ? "[Image]" : "[File]");
      setSelectedFile(null);
    } catch (err: any) {
      setUploadError("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

 
  const handleSendMessage = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!conversation) return;
    if (newMessage.trim() === "" && pendingAttachments.length === 0) return;

    setIsSending(true);
    try {
      console.log("Sending message:", newMessage.trim(), "to conversation:", conversation.id);
      
      
      const replyData = replyToMessage ? {
        messageId: replyToMessage.id,
        message: replyToMessage.message,
        senderType: replyToMessage.senderType,
        messageType: replyToMessage.messageType,
      } : undefined;
      
      
      if (isConnected) {
        
        const tempMsg: ChatMessage = {
          id: `temp-${Date.now()}`,
          conversationId: conversation.id,
          senderId: "user",
          senderType: "user" as const,
          message: newMessage.trim() || (pendingType === "image" ? "[Image]" : "[File]"),
          messageType: pendingType ?? "text",
          timestamp: new Date(),
          isRead: false,
          attachments: pendingAttachments.map((url) => ({
            fileName: url.split('/').pop() || 'file',
            originalName: url.split('/').pop() || 'file',
            fileType: (pendingType === 'image' ? 'image' : 'document'),
            mimeType: pendingType === 'image' ? 'image/jpeg' : 'application/octet-stream',
            fileSize: 0,
            filePath: url,
            uploadedAt: new Date(),
          })) as any,
          isDeleted: false,
          replyTo: replyData
        };
        setMessages(prev => [...prev, tempMsg]);
        setTempMessage(newMessage.trim());
        
        sendMessage(conversation.id, tempMsg.message, tempMsg.messageType, pendingAttachments);
        setNewMessage("");
        setPendingAttachments([]);
        setPendingType(null);
        setReplyToMessage(null);
        setShowReplyPreview(false);
        setIsSending(false);
      } else {
        
        const response = await sendMessageAPI(
          conversation.id,
          newMessage.trim() || (pendingType === "image" ? "[Image]" : "[File]"),
          pendingType ?? "text",
          pendingAttachments,
          replyData
        );
        console.log("Send message response:", response.data);

        if (response.data.success) {
          setMessages((prev) => [...prev, response.data.message]);
          setNewMessage("");
          setPendingAttachments([]);
          setPendingType(null);
          setReplyToMessage(null);
          setShowReplyPreview(false);
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
    if (!conversation) return;

    try {
      await deleteMessageAPI(messageId);
      // Don't update UI here - let the socket event handle it for real-time updates
      // The socket event will automatically remove the message from the UI
      toast.success("Message deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiObject: any) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  
  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyToMessage(message);
    setShowReplyPreview(true);
    
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (input) input.focus();
  };

  
  const cancelReply = () => {
    setReplyToMessage(null);
    setShowReplyPreview(false);
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

 
  const handleBackToConsultation = () => {
    navigate(`/consultation/${doctorId}`);
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
                {/* Back Button */}
                <button
                  onClick={handleBackToConsultation}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors mr-2"
                  title="Back to Consultation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                
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
              {/* Socket Connection Status */}
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {socket && isConnected && (
                  <span className="text-xs text-gray-500">
                    ID: {socket.id?.substring(0, 8)}...
                  </span>
                )}
              </div>
            </div>

            {/* Reply Preview */}
            {showReplyPreview && replyToMessage && (
              <div className="bg-gray-100 border-l-4 border-blue-500 p-3 mb-3 mx-6 rounded-r-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      Replying to {replyToMessage.senderType === 'doctor' ? 'Doctor' : 'You'}
                    </div>
                    <div className="text-sm text-gray-700 truncate">
                      {replyToMessage.messageType === 'image' ? '[Image]' : 
                       replyToMessage.messageType === 'file' ? '[File]' : 
                       replyToMessage.message}
                    </div>
                  </div>
                  <button
                    onClick={cancelReply}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

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
                    }`}
                  >
                    <div
                      className={`flex max-w-xs lg:max-w-md ${
                        message.senderType === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      } items-end space-x-2 group`}
                    >
                      {message.senderType === "doctor" && (
                        <img
                          src={doctor?.avatar || "https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=40&h=40&fit=crop&crop=face"}
                          alt="Doctor Avatar"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div className="relative">
                        {/* Reply Preview in Message */}
                        {message.replyTo && (
                          <div className="mb-2 p-2 bg-gray-100 rounded-lg border-l-2 border-blue-400">
                            <div className="text-xs text-gray-500 mb-1">
                              {message.replyTo.senderType === 'doctor' ? 'Doctor' : 'You'}
                            </div>
                            <div className="text-xs text-gray-700 truncate">
                              {message.replyTo.messageType === 'image' ? '[Image]' : 
                               message.replyTo.messageType === 'file' ? '[File]' : 
                               message.replyTo.message}
                            </div>
                          </div>
                        )}
                        
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            message.senderType === "user"
                              ? "bg-blue-500 text-white rounded-br-sm"
                              : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                          }`}
                        >
                          {message.messageType === "image" && message.attachments && message.attachments[0] ? (
                            <img onClick={() => setPreviewImage(`${import.meta.env.VITE_BACKEND_URL}${message.attachments[0].filePath}`)} src={`${import.meta.env.VITE_BACKEND_URL}${message.attachments[0].filePath}`} alt="sent-img" className="max-w-[200px] max-h-[200px] rounded mb-1 cursor-zoom-in" />
                          ) : message.messageType === "file" && message.attachments && message.attachments[0] ? (
                            <a href={`${import.meta.env.VITE_BACKEND_URL}${message.attachments[0].filePath}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download File</a>
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
                        
                        {/* Action Buttons */}
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                          {/* Reply Button - hidden */}
                          {/**
                          <button
                            onClick={() => handleReplyToMessage(message)}
                            className="w-6 h-6 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center"
                            title="Reply to message"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                          */}
                          
                          {/* Delete Button */}
                          {message.senderType === "user" && !message.id.startsWith('temp-') && (
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center"
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
              <div className="flex items-center space-x-3">
                {/* File upload button */}
                <label className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
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
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isSending}
                  />
                </label>

                {/* Emoji Button */}
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Add emoji"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-20 left-6 z-50">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      
                      
                      if (isConnected && conversation) {
                        // Clear existing timeout
                        if (typingTimeout) {
                          clearTimeout(typingTimeout);
                        }
                        
                        
                        startTyping(conversation.id);
                        
                        
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="preview" className="max-w-[90vw] max-h-[90vh] rounded shadow-lg" />
        </div>
      )}
    </div>
  );
};

export default ChatPage;

