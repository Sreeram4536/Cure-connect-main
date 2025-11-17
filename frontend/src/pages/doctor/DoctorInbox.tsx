import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getDoctorConversationsAPI, getDoctorConversationWithUserAPI } from "../../services/chatServices";
import { DoctorContext } from "../../context/DoctorContext";
import { useSocket } from "../../context/SocketContext";
import type { Conversation } from "../../types/chat";

const DoctorInbox: React.FC = () => {
  const navigate = useNavigate();
  const { loading: contextLoading } = useContext(DoctorContext);
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfoByConversation, setUserInfoByConversation] = useState<Record<string, { name: string; avatar: string }>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadConversations();
  }, [currentPage]);

  // Listen for real-time new messages and conversation updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data: { message: any; conversationId: string }) => {
      // Only update if message is from a user (not from doctor)
      if (data.message.senderType === 'user') {
        // Update the conversation list in real-time
        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv.id === data.conversationId) {
              return {
                ...conv,
                lastMessage: data.message.message || `${data.message.attachments?.length || 0} file(s)`,
                lastMessageTime: new Date(data.message.timestamp),
                unreadCount: (conv.unreadCount || 0) + 1
              };
            }
            return conv;
          });
          
          // If conversation doesn't exist in current page, refresh the list
          const exists = updated.some(conv => conv.id === data.conversationId);
          if (!exists) {
            loadConversations();
          }
          
          return updated;
        });
      }
    };

    const handleConversationUpdate = () => {
      // Refresh conversations when updated
      loadConversations();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConversationUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConversationUpdate);
    };
  }, [socket, isConnected]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await getDoctorConversationsAPI(currentPage, 10);
      if (response.data.success) {
        setConversations(response.data.conversations);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.totalCount || 0);

        // Fetch user info for each conversation to display proper patient name and avatar
        const infos = await Promise.all(
          (response.data.conversations as Conversation[]).map(async (c) => {
            try {
              const res = await getDoctorConversationWithUserAPI(c.id);
              if (res.data.success && res.data.user) {
                return [c.id, { name: res.data.user.name, avatar: res.data.user.avatar }] as const;
              }
            } catch {}
            return null;
          })
        );
        const map: Record<string, { name: string; avatar: string }> = {};
        infos.forEach((entry) => {
          if (entry) {
            const [id, info] = entry;
            map[id] = info;
          }
        });
        setUserInfoByConversation(map);
      }
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Message Inbox</h1>
          <p className="text-gray-600">View and respond to patient messages</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading conversations...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {conversations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Messages Yet</h3>
                <p className="text-gray-600">You don't have any conversations yet. Messages from patients will appear here.</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={userInfoByConversation[conversation.id]?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face"}
                            alt={userInfoByConversation[conversation.id]?.name || "Patient"}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {userInfoByConversation[conversation.id]?.name || `Patient ${conversation.userId.slice(-4)}`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>
                              {conversation.lastMessageTime 
                                ? formatDate(conversation.lastMessageTime)
                                : formatDate(conversation.createdAt)
                              }
                            </span>
                            <span>
                              {conversation.lastMessageTime 
                                ? formatTime(conversation.lastMessageTime)
                                : formatTime(conversation.createdAt)
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {conversation.unreadCount > 0 && (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                            {conversation.unreadCount} new
                          </span>
                        )}
                        <button
                          onClick={() => navigate(`/doctor/chat/${conversation.id}`)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          View Chat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        currentPage === page
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{totalCount}</div>
                  <div className="text-sm text-gray-600">Total Conversations</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {conversations.filter(c => c.unreadCount > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Unread Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {conversations.filter(c => c.unreadCount === 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Read Conversations</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorInbox; 