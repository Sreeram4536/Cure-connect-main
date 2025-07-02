import { useContext } from "react";
import { assets } from "../../assets/admin/assets";
import { AdminContext } from "../../context/AdminContext";
import { useNavigate } from "react-router-dom";
import { clearAdminAccessToken } from "../../context/tokenManagerAdmin";
import { logoutAdminAPI } from "../../services/adminServices";
import { LogOut } from "lucide-react";

const AdminNavbar = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("AdminContext must be used within AdminContextProvider");
  }
  const { setAToken } = context;
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await logoutAdminAPI();
      setAToken("");
      localStorage.setItem("isAdminLoggedOut", "true");
      clearAdminAccessToken();
      navigate("/admin/login");
    } catch (error) {
      console.error("Admin logout failed:", error);
    }
  };

  return (
    <div className="flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-gradient-to-r from-white via-gray-100 to-gray-200">
      <div className="flex items-center gap-2 text-xs">
        <img className="w-36 sm:w-40 cursor-pointer" src={assets.logo} alt="CureConnect Logo" />
        <p className="border px-2.5 py-0.5 rounded-full border-gray-400 text-gray-700 bg-gray-100 font-semibold tracking-wide">Admin</p>
      </div>
      <button
        onClick={logout}
        className="bg-blue-500 text-white text-sm px-10 py-2 rounded-full font-semibold flex items-center gap-2 shadow hover:bg-blue-600 transition"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default AdminNavbar;
