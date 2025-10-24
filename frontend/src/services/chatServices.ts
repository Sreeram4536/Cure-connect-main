import { getApi } from "../axios/axiosInstance";
const api = getApi("user");
const doctorApi = getApi("doctor");

// Chat API endpoints
const CHAT_API = {
  CONVERSATIONS: "/api/chat/conversations",
  MESSAGES: "/api/chat/messages",
  DOCTOR_CONVERSATIONS: "/api/chat/doctor/conversations",
};

// User chat services
export const createConversationAPI = (doctorId: string) => {
  return api.post(CHAT_API.CONVERSATIONS, { doctorId });
};

export const getConversationAPI = (doctorId: string) => {
  return api.get(`${CHAT_API.CONVERSATIONS}/${doctorId}`);
};

export const getUserConversationsAPI = (page: number = 1, limit: number = 20) => {
  return api.get(CHAT_API.CONVERSATIONS, {
    params: { page, limit },
  });
};

export const sendMessageAPI = (
  conversationId: string, 
  message: string, 
  messageType: string = "text", 
  attachments?: string[],
  replyTo?: {
    messageId: string;
    message: string;
    senderType: "user" | "doctor";
    messageType: "text" | "image" | "file" | "mixed";
  }
) => {
  return api.post(CHAT_API.MESSAGES, {
    conversationId,
    message,
    messageType,
    attachments,
    replyTo
  });
};

export const getMessagesAPI = (conversationId: string, page: number = 1, limit: number = 50) => {
  return api.get(`${CHAT_API.MESSAGES}/${conversationId}`, {
    params: { page, limit },
  });
};

// Doctor-scoped: fetch messages with doctor token
export const getDoctorMessagesAPI = (conversationId: string, page: number = 1, limit: number = 50) => {
  return doctorApi.get(`${CHAT_API.MESSAGES}/${conversationId}`, {
    params: { page, limit },
  });
};

export const getMessagesByDoctorAPI = (doctorId: string, page: number = 1, limit: number = 50) => {
  return api.get(`${CHAT_API.MESSAGES}/doctor/${doctorId}`, {
    params: { page, limit },
  });
};

export const markConversationAsReadAPI = (conversationId: string) => {
  return api.patch(`${CHAT_API.CONVERSATIONS}/${conversationId}/read`);
};

export const getUnreadCountAPI = (conversationId: string) => {
  return api.get(`${CHAT_API.CONVERSATIONS}/${conversationId}/unread`);
};

export const deleteConversationAPI = (conversationId: string) => {
  return api.delete(`${CHAT_API.CONVERSATIONS}/${conversationId}`);
};

export const deleteMessageAPI = (messageId: string) => {
  return api.patch(`${CHAT_API.MESSAGES}/${messageId}/soft-delete`);
};

// Doctor delete message (uses doctor token)
export const doctorDeleteMessageAPI = (messageId: string) => {
  return doctorApi.patch(`${CHAT_API.MESSAGES}/${messageId}/soft-delete`);
};

// File utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isImageFile = (fileType: string): boolean => {
  return fileType.startsWith('image/');
};

export const isDocumentFile = (fileType: string): boolean => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];
  return documentTypes.includes(fileType);
};

// File utility functions
export const getFileUrlAPI = (fileName: string): string => {
  // Assuming your files are served from your backend
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  return `${baseUrl}/uploads/chat/${fileName}`;
};

export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop() || '';
};

// Doctor chat services
export const getDoctorConversationsAPI = (page: number = 1, limit: number = 20) => {
  return doctorApi.get(CHAT_API.DOCTOR_CONVERSATIONS, {
    params: { page, limit },
  });
};

export const getDoctorConversationWithUserAPI = (conversationId: string) => {
  return doctorApi.get(`${CHAT_API.CONVERSATIONS}/${conversationId}/with-user`);
};

export const sendDoctorMessageAPI = (
  conversationId: string, 
  message: string, 
  messageType: string = "text", 
  attachments?: string[],
  replyTo?: {
    messageId: string;
    message: string;
    senderType: "user" | "doctor";
    messageType: "text" | "image" | "file" | "mixed";
  }
) => {
  return doctorApi.post(`${CHAT_API.MESSAGES}/doctor`, {
    conversationId,
    message,
    messageType,
    attachments,
    replyTo
  });
}; 