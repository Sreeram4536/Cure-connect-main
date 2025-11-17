import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { getDoctorConversationsAPI } from '../../services/chatServices';
import { toast } from 'react-toastify';
import type { Conversation } from '../../types/chat';

const DoctorSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket, isConnected } = useSocket();

  const assets = {
    home_icon: "🏠",
    profile_icon: "👤",
    appointment_icon: "📅",
    add_icon: "➕",
    slot_icon: "⏰",
    inbox_icon: "📬",
    wallet_icon: "💰",
    history_icon: "📋",
  };

  // Fetch initial unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await getDoctorConversationsAPI(1, 100); // Get all conversations
        if (response.data.success) {
          const conversations = response.data.conversations || [];
          const totalUnread = conversations.reduce(
            (sum: number, conv: Conversation) => sum + (conv.unreadCount || 0),
            0
          );
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Refresh unread count every 30 seconds as fallback
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time new messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data: { message: any; conversationId: string }) => {
      // Only update if message is from a user (not from doctor)
      if (data.message.senderType === 'user') {
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast.info('New message received', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    };

    // Listen for conversation updates (when unread count changes)
    const handleConversationUpdate = (data?: { conversationId?: string; unreadCount?: number }) => {
      // Refresh unread count when conversation is updated
      // Only refresh if the update indicates a change in unread count
      // If data is provided and unreadCount is 0, it means messages were read (decrease count)
      // If no data or unreadCount > 0, refresh from API
      getDoctorConversationsAPI(1, 100)
        .then(response => {
          if (response.data.success) {
            const conversations = response.data.conversations || [];
            const totalUnread = conversations.reduce(
              (sum: number, conv: Conversation) => sum + (conv.unreadCount || 0),
              0
            );
            setUnreadCount(totalUnread);
          }
        })
        .catch(error => console.error('Error refreshing unread count:', error));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConversationUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConversationUpdate);
    };
  }, [socket, isConnected]);

  // Reset unread count when navigating to inbox (optional - can be removed if you want count to persist)
  const handleInboxClick = () => {
    // Don't reset count here - let it update naturally when messages are read
    // The count will decrease when messages are marked as read in the inbox
  };

  const menuItems = [
    {
      to: "/doctor/dashboard",
      icon: assets.home_icon,
      label: "Dashboard",
      gradient: "from-blue-500 to-primary"
    },
    {
      to: "/doctor/appointments",
      icon: assets.appointment_icon,
      label: "Appointments",
      gradient: "from-blue-500 to-primary"
    },
    {
      to: "/doctor/patient-history",
      icon: assets.history_icon,
      label: "Patient History",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      to: "/doctor/profile",
      icon: assets.profile_icon,
      label: "Profile",
      gradient: "from-blue-500 to-primary"
    },
    {
      to: "/doctor/slot-management",
      icon: assets.slot_icon,
      label: "Slot management",
      gradient: "from-blue-500 to-primary"
    },
    {
      to: "/doctor/inbox",
      icon: assets.inbox_icon,
      label: "Messages",
      gradient: "from-blue-500 to-primary",
      hasNotification: true // Mark this item for notification badge
    },
    {
      to: "/doctor/wallet",
      icon: assets.wallet_icon,
      label: "Wallet",
      gradient: "from-green-500 to-emerald-600"
    },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'} relative group`}>
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-50 via-purple-50 to-transparent opacity-60"></div>
      <div className="absolute top-10 right-4 w-8 h-8 bg-blue-100 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute top-20 right-8 w-4 h-4 bg-purple-100 rounded-full opacity-40 animate-bounce"></div>

      {/* Header Section */}
      <div className="relative z-10 p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              🧑🏻‍⚕️
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-primary bg-clip-text text-transparent">
                  Doctor Panel
                </h1>
                <p className="text-sm text-gray-500">CureConnect</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <div className={`w-5 h-5 flex flex-col justify-center items-center transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
              <div className="w-3 h-0.5 bg-gray-600 mb-1"></div>
              <div className="w-3 h-0.5 bg-gray-600 mb-1"></div>
              <div className="w-3 h-0.5 bg-gray-600"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="relative z-10 p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index} className="group/item">
              <NavLink
                to={item.to}
                onClick={item.hasNotification ? handleInboxClick : undefined}
                className={({ isActive }) =>
                  `relative flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group-hover/item:transform group-hover/item:scale-105 overflow-hidden ${
                    isActive
                      ? 'bg-white shadow-lg border border-gray-200 text-gray-800'
                      : 'text-gray-600 hover:bg-white/70 hover:shadow-md hover:text-gray-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 transition-opacity duration-300 ${isActive ? 'opacity-10' : 'group-hover/item:opacity-5'}`}></div>

                    {isActive && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${item.gradient} rounded-r-full`}></div>
                    )}

                    <div className={`relative w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${
                      isActive 
                        ? `bg-gradient-to-r ${item.gradient} shadow-lg` 
                        : 'bg-gray-100 group-hover/item:bg-gradient-to-r group-hover/item:' + item.gradient
                    }`}>
                      <span className={`text-sm transition-all duration-300 ${
                        isActive ? 'text-white' : 'text-gray-600 group-hover/item:text-white'
                      }`}>
                        {item.icon}
                      </span>
                      
                      {/* Notification Badge */}
                      {item.hasNotification && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg animate-pulse">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && (
                      <span className="font-medium text-sm transition-colors duration-300 group-hover/item:text-gray-800 relative flex-1">
                        {item.label}
                        {/* Badge for expanded sidebar - alternative position */}
                        {item.hasNotification && unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </span>
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-300 whitespace-nowrap z-50">
                        {item.label}
                        {item.hasNotification && unreadCount > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-4 flex items-center justify-center px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                        <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                      </div>
                    )}

                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.gradient} transform scale-x-0 group-hover/item:scale-x-100 transition-transform duration-300 origin-left`}></div>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <p className="font-medium text-sm text-gray-800">System Status</p>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                All Systems Operational
              </p>
            </div>
          </div>
        </div>
      )} */}

      {isCollapsed && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <button className="w-12 h-12 bg-gradient-to-r from-blue-500 to-primary rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all duration-300 hover:scale-110">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </button>
        </div>
      )}
    </div>
  );
};

export default DoctorSidebar;