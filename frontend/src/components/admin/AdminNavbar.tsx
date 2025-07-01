import { useContext } from "react";
import { assets } from "../../assets/admin/assets";
import { AdminContext } from "../../context/AdminContext";
import { useNavigate } from "react-router-dom";
import { clearAdminAccessToken } from "../../context/tokenManagerAdmin";
import { logoutAdminAPI } from "../../services/adminServices";
import { LogOut, Bell, Settings, User, Shield, Menu } from "lucide-react";

const AdminNavbar = () => {
  const context = useContext(AdminContext);

  if (!context) {
    throw new Error("AdminContext must be used within AdminContextProvider");
  }

  const { aToken, setAToken } = context;

  const navigate = useNavigate();

const logout = async () => {
  try {
    await logoutAdminAPI(); // ✅ call API to clear cookie

    setAToken("");
        localStorage.setItem("isAdminLoggedOut", "true");
    clearAdminAccessToken();

    navigate("/admin/login");
  } catch (error) {
    console.error("Admin logout failed:", error);
  }
};

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-xl border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/30">
                <img className="w-6 h-6 brightness-0 invert" src={assets.logo} alt="CureConnect" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white">CureConnect</h1>
                <p className="text-xs text-white/80">Admin Dashboard</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2 ml-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-white/90 font-medium">System Online</span>
            </div>
          </div>

          {/* Center Section - Quick Stats */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm text-white font-medium">1,234 Users</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-white font-medium">567 Doctors</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-sm text-white font-medium">89 Pending</span>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <Bell className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
              <div className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <div className="p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Notifications</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">New doctor registration request</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-700">System backup completed</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </button>

            {/* Settings */}
            <button className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Settings className="w-5 h-5 text-white" />
            </button>

            {/* Admin Profile */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">Admin</p>
                <p className="text-xs text-white/80">Super Admin</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium hover:bg-white/30 transition-all duration-300 border border-white/30 hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;
