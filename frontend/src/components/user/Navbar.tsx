import { useContext, useState } from "react";
import { assets } from "../../assets/user/assets";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { clearUserAccessToken } from "../../context/tokenManagerUser";
import { logoutUserAPI } from "../../services/authServices";
import { Home, Users, Info, Phone, User, LogOut, Menu, X } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();

  const context = useContext(AppContext);

  if (!context) {
    throw new Error("TopDoctors must be used within an AppContextProvider");
  }

  const { token, setToken, userData, setUserData } = context;

  const [showMenu, setShowMenu] = useState(false);

const logout = async () => {
  try {
    // 1. Call backend first to clear the HTTP-only refresh token cookie
    await logoutUserAPI(); // ✅ MUST BE /api/user/logout (POST)

    // 2. Clear access token from memory
    clearUserAccessToken(); // ✅ Removes it from your tokenManagerUser

    // 3. Clear context state
    setToken(null);        // ✅ Also calls updateUserAccessToken(null)
    setUserData(null);     // Clear user profile from context

    // 4. 🔥 Remove this — no longer using localStorage
    // localStorage.removeItem("user_token"); ❌ REMOVE THIS
    localStorage.setItem("isUserLoggedOut", "true");
    // 5. Navigate away
    navigate("/login");
  } catch (error) {
    console.error("Logout failed", error);
  }
};

  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <img
            onClick={() => navigate("/")}
            className="w-44 cursor-pointer hover:opacity-80 transition-opacity duration-300"
            src={assets.logo}
            alt="CureConnect"
          />

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-8 font-medium">
            <NavLink to="/home" className="group">
              <li className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300">
                <Home className="w-4 h-4" />
                HOME
              </li>
            </NavLink>
            <NavLink to="/doctors" className="group">
              <li className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300">
                <Users className="w-4 h-4" />
                ALL DOCTORS
              </li>
            </NavLink>
            <NavLink to="/about" className="group">
              <li className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300">
                <Info className="w-4 h-4" />
                ABOUT
              </li>
            </NavLink>
            <NavLink to="/contact" className="group">
              <li className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300">
                <Phone className="w-4 h-4" />
                CONTACT
              </li>
            </NavLink>
          </ul>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {token && userData ? (
              <div className="flex items-center gap-3 cursor-pointer group relative">
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-3 py-2 border border-white/30 hover:bg-white/80 transition-all duration-300">
                  <img className="w-8 h-8 rounded-full object-cover border-2 border-primary/20" src={userData.image} alt="Profile" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">{userData.name}</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-56 bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-white/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
                  <div className="p-4 space-y-3">
                    <div className="border-b border-gray-200 pb-3">
                      <p className="text-sm text-gray-500">Signed in as</p>
                      <p className="font-semibold text-gray-800">{userData.email}</p>
                    </div>
                    
                    <button
                      onClick={() => navigate("/my-profile")}
                      className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300"
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </button>
                    
                    <button
                      onClick={() => navigate("/my-appointments")}
                      className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300"
                    >
                      <Home className="w-4 h-4" />
                      <span>My Appointments</span>
                    </button>
                    
                    <div className="border-t border-gray-200 pt-3">
                      <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-primary to-blue-600 text-white px-8 py-3 rounded-full font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hidden md:block"
              >
                Create Account
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMenu(true)}
              className="md:hidden p-2 rounded-lg bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 transition-all duration-300"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`${
          showMenu ? "fixed inset-0 z-50" : "hidden"
        } md:hidden`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowMenu(false)}
        ></div>
        
        {/* Menu Panel */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/95 backdrop-blur-md shadow-2xl border-l border-white/30">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <img className="w-32" src={assets.logo} alt="CureConnect" />
            <button
              onClick={() => setShowMenu(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-300"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>
          
          <div className="p-6">
            <ul className="space-y-2">
              <NavLink onClick={() => setShowMenu(false)} to="/home">
                <li className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300">
                  <Home className="w-5 h-5" />
                  <span className="font-medium">HOME</span>
                </li>
              </NavLink>
              <NavLink onClick={() => setShowMenu(false)} to="/doctors">
                <li className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">ALL DOCTORS</span>
                </li>
              </NavLink>
              <NavLink onClick={() => setShowMenu(false)} to="/about">
                <li className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300">
                  <Info className="w-5 h-5" />
                  <span className="font-medium">ABOUT</span>
                </li>
              </NavLink>
              <NavLink onClick={() => setShowMenu(false)} to="/contact">
                <li className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300">
                  <Phone className="w-5 h-5" />
                  <span className="font-medium">CONTACT</span>
                </li>
              </NavLink>
            </ul>
            
            {!token && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate("/login");
                  }}
                  className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
