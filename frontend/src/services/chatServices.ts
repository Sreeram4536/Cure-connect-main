import { api } from "../axios/axiosInstance";
import { doctorApi } from "../axios/doctorAxiosInstance";
import { SendMessageWithFilesRequest, Attachment } from "../types/chat";

// Chat API endpoints
const CHAT_API = {
  CONVERSATIONS: "/api/chat/conversations",
  MESSAGES: "/api/chat/messages",
  DOCTOR_CONVERSATIONS: "/api/chat/doctor/conversations",
  FILES: "/api/chat/files",
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

export const sendMessageAPI = (conversationId: string, message: string, messageType: string = "text", attachments?: Attachment[]) => {
  return api.post(CHAT_API.MESSAGES, {
    conversationId,
    message,
    messageType,
    attachments,
  });
};

// New file upload API for users
export const sendMessageWithFilesAPI = (data: SendMessageWithFilesRequest, onUploadProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('conversationId', data.conversationId);
  if (data.message) {
    formData.append('message', data.message);
  }
  
  data.files.forEach((file) => {
    formData.append('files', file);
  });

  return api.post(`${CHAT_API.MESSAGES}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onUploadProgress ? (progressEvent) => {
      const progress = progressEvent.total 
        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
        : 0;
      onUploadProgress(progress);
    } : undefined,
  });
};

export const getMessagesAPI = (conversationId: string, page: number = 1, limit: number = 50) => {
  return api.get(`${CHAT_API.MESSAGES}/${conversationId}`, {
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

// Enhanced message operations
export const deleteMessageAPI = (messageId: string) => {
  return api.patch(`${CHAT_API.MESSAGES}/${messageId}/soft-delete`);
};

export const softDeleteMessageAPI = (messageId: string) => {
  return api.patch(`${CHAT_API.MESSAGES}/${messageId}/soft-delete`);
};

export const restoreMessageAPI = (messageId: string) => {
  return api.patch(`${CHAT_API.MESSAGES}/${messageId}/restore`);
};

export const permanentlyDeleteMessageAPI = (messageId: string) => {
  return api.delete(`${CHAT_API.MESSAGES}/${messageId}/permanent`);
};

export const getDeletedMessagesAPI = (conversationId: string, page: number = 1, limit: number = 50) => {
  return api.get(`${CHAT_API.MESSAGES}/${conversationId}/deleted`, {
    params: { page, limit },
  });
};

// File download API
export const getFileUrlAPI = (fileName: string) => {
  return `${CHAT_API.FILES}/${fileName}`;
};

export const downloadFileAPI = (fileName: string) => {
  return api.get(`${CHAT_API.FILES}/${fileName}`, {
    responseType: 'blob',
  });
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

export const sendDoctorMessageAPI = (conversationId: string, message: string, messageType: string = "text", attachments?: Attachment[]) => {
  return doctorApi.post(`${CHAT_API.MESSAGES}/doctor`, {
    conversationId,
    message,
    messageType,
    attachments,
  });
};

// New file upload API for doctors
export const sendDoctorMessageWithFilesAPI = (data: SendMessageWithFilesRequest, onUploadProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('conversationId', data.conversationId);
  if (data.message) {
    formData.append('message', data.message);
  }
  
  data.files.forEach((file) => {
    formData.append('files', file);
  });

  return doctorApi.post(`${CHAT_API.MESSAGES}/doctor/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onUploadProgress ? (progressEvent) => {
      const progress = progressEvent.total 
        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
        : 0;
      onUploadProgress(progress);
    } : undefined,
  });
};

// Doctor message operations
export const doctorDeleteMessageAPI = (messageId: string) => {
  return doctorApi.patch(`${CHAT_API.MESSAGES}/${messageId}/soft-delete`);
};

export const doctorRestoreMessageAPI = (messageId: string) => {
  return doctorApi.patch(`${CHAT_API.MESSAGES}/${messageId}/restore`);
};

export const doctorPermanentlyDeleteMessageAPI = (messageId: string) => {
  return doctorApi.delete(`${CHAT_API.MESSAGES}/${messageId}/permanent`);
};

// Utility functions
export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

export const isDocumentFile = (mimeType: string): boolean => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];
  return documentTypes.includes(mimeType);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop() || '';
}; 