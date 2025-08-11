import { api } from "../axios/axiosInstance";
import { doctorApi } from "../axios/doctorAxiosInstance";

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

export const sendMessageAPI = (conversationId: string, message: string, messageType: string = "text", attachments?: string[]) => {
  return api.post(CHAT_API.MESSAGES, {
    conversationId,
    message,
    messageType,
    attachments,
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

export const deleteMessageAPI = (messageId: string) => {
  return api.delete(`${CHAT_API.MESSAGES}/${messageId}`);
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

export const sendDoctorMessageAPI = (conversationId: string, message: string, messageType: string = "text", attachments?: string[]) => {
  return doctorApi.post(`${CHAT_API.MESSAGES}/doctor`, {
    conversationId,
    message,
    messageType,
    attachments,
  });
};

// Upload attachments (user)
export const uploadChatAttachmentsAPI = (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return api.post(`${CHAT_API.MESSAGES}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Upload attachments (doctor)
export const uploadDoctorChatAttachmentsAPI = (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return doctorApi.post(`${CHAT_API.MESSAGES}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}; 