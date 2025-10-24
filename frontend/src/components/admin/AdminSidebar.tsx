import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, AlertTriangle, UserCheck, MessageSquare, ChevronLeft, ChevronRight, Activity, Shield, Wallet } from 'lucide-react';

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      to: "/admin/dashboard",
      icon: Home,
      label: "Dashboard",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      to: "/admin/user-management",
      icon: Users,
      label: "Manage Users",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    {
      to: "/admin/appointments",
      icon: Calendar,
      label: "Appointments",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      to: "/admin/doctor-requests",
      icon: AlertTriangle,
      label: "Doctor Requests",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    {
      to: "/admin/all-doctors",
      icon: UserCheck,
      label: "Doctor List",
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200"
    },
    // {
    //   to: "/admin/inbox",
    //   icon: MessageSquare,
    //   label: "Inbox",
    //   color: "from-teal-500 to-cyan-500",
    //   bgColor: "bg-teal-50",
    //   borderColor: "border-teal-200"
    // },
    {
      to: "/admin/wallet",
      icon: Wallet,
      label: "Wallet Management",
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50 border-r border-white/50 transition-all duration-500 ${isCollapsed ? 'w-20' : 'w-80'} relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-4 w-32 h-32 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-4 w-40 h-40 bg-gradient-to-r from-indigo-400/10 to-pink-400/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-2xl animate-spin"></div>
      </div>

      {/* Header Section */}
      <div className="relative z-10 p-6 border-b border-white/30 bg-white/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-xs text-gray-600">Control Center</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-300 border border-white/30 hover:scale-110"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-700" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="relative z-10 p-4">
        <ul className="space-y-3">
          {menuItems.map((item, index) => (
            <li key={index} className="group">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 overflow-hidden group-hover:transform group-hover:scale-105 ${
                    isActive
                      ? 'bg-white shadow-xl border border-white/50 text-gray-800'
                      : 'text-gray-700 hover:bg-white/60 hover:shadow-lg hover:text-gray-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 transition-opacity duration-500 ${isActive ? 'opacity-10' : 'group-hover:opacity-5'}`}></div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${item.color} rounded-r-full shadow-lg`}></div>
                    )}

                    {/* Icon Container */}
                    <div className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-500 shadow-md ${
                      isActive 
                        ? `bg-gradient-to-r ${item.color} shadow-lg` 
                        : `bg-white/80 group-hover:bg-gradient-to-r group-hover:${item.color}`
                    }`}>
                      <item.icon className={`w-5 h-5 transition-all duration-500 ${
                        isActive ? 'text-white' : 'text-gray-600 group-hover:text-white'
                      }`} />
                    </div>

                    {/* Label */}
                    {!isCollapsed && (
                      <span className="font-semibold text-sm transition-all duration-500 group-hover:text-gray-800">
                        {item.label}
                      </span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-4 py-2 bg-gray-800 text-white text-sm rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-50 border border-white/20">
                        {item.label}
                        <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45 border-l border-b border-white/20"></div>
                      </div>
                    )}

                    {/* Bottom Border Animation */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-b-2xl`}></div>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Status Section
      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/30 bg-white/20 backdrop-blur-sm">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-sm text-gray-800">System Status</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">CPU Usage</span>
                <span className="font-medium text-green-600">23%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Memory</span>
                <span className="font-medium text-blue-600">67%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Network</span>
                <span className="font-medium text-purple-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Collapsed Status Indicator */}
      {isCollapsed && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg flex items-center justify-center border border-white/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSidebar;
