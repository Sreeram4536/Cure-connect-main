import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/admin/assets";
import type { AppointmentTypes } from "../../types/appointment";
import { motion } from "framer-motion";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const context = useContext(DoctorContext);
  const appContext = useContext(AppContext);

  console.log("DoctorDashboard: Component is rendering");

  if (!context) throw new Error("DoctorContext must be used within DoctorContextProvider");
  if (!appContext) throw new Error("AppContext must be used within AppContextProvider");

  const { dToken, dashData, getDashData, cancelAppointment, loading } = context;
  const { slotDateFormat } = appContext;

  useEffect(() => {
    if (dToken) {
      console.log("Doctor dashboard: Getting dash data with token:", dToken);
      getDashData();
    } else {
      console.log("Doctor dashboard: No token available");
    }
  }, [dToken]);

  useEffect(() => {
    // Only redirect if not loading and no token
    if (!loading && !dToken) {
      console.log("Doctor dashboard: No token and not loading, redirecting to login");
      console.log("Doctor dashboard: Current dToken value:", dToken);
      navigate("/doctor/login");
    } else if (!loading && dToken) {
      console.log("Doctor dashboard: Token available and not loading, staying on dashboard");
    }
  }, [dToken, loading, navigate]);

  console.log("Doctor dashboard: Rendering with dashData:", dashData);
  console.log("Doctor dashboard: Token available:", !!dToken);
  console.log("Doctor dashboard: Loading state:", loading);

  // Show loading state while context is initializing
  if (loading) {
    return (
      <div className="m-5">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p className="text-center text-gray-500 mt-4">Initializing...</p>
      </div>
    );
  }

  // Show loading state while dashData is being fetched
  if (!dashData) {
    return (
      <div className="m-5">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p className="text-center text-gray-500 mt-4">Loading dashboard data...</p>
        <p className="text-center text-gray-400 mt-2">Token: {dToken ? 'Available' : 'Not available'}</p>
        <p className="text-center text-gray-400 mt-2">Loading: {loading ? 'Yes' : 'No'}</p>
        <button 
          onClick={() => navigate("/doctor/appointments")}
          className="mt-4 px-4 py-2 bg-primary text-white rounded"
        >
          Test Navigation to Appointments
        </button>
      </div>
    );
  }

  return (
    <div className="m-5 space-y-10">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            count: `₹${dashData.totalEarnings || 0}`,
            label: "Total Earnings",
            icon: assets.earning_icon,
            color: "from-red-400 to-black-500",
            path: "/doctor/appointments",
          },
          {
            count: dashData.totalAppointments || 0,
            label: "Total Appointments",
            icon: assets.appointments_icon,
            color: "from-blue-400 to-indigo-500",
            path: "/doctor/appointments",
          },
          {
            count: dashData.pendingAppointments || 0,
            label: "Pending Appointments",
            icon: assets.patients_icon,
            color: "from-green-400 to-teal-500",
            path: "/doctor/appointments",
          }
        ].map((card, idx) => (
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            key={idx}
            onClick={() => navigate(card.path)}
            className={`cursor-pointer bg-gradient-to-r ${card.color} text-white p-6 rounded-xl shadow-md flex items-center gap-4`}
          >
            <img src={card.icon} alt={card.label} className="w-12 h-12" />
            <div>
              <p className="text-2xl font-bold">{card.count}</p>
              <p className="text-sm opacity-80">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Latest Appointments */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b">
          <img src={assets.list_icon} alt="" className="w-6" />
          <p className="font-semibold text-gray-700 text-lg">Recent Appointments</p>
        </div>
        <div className="divide-y">
          {dashData.latestAppointments && dashData.latestAppointments.length > 0 ? (
            dashData.latestAppointments.map((item: AppointmentTypes, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
              >
                <img 
                  src={item.userData?.image || "/default-avatar.png"} 
                  className="w-10 h-10 rounded-full" 
                  alt="" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-gray-800">{item.userData?.name || 'Unknown'}</p>
                  <p className="text-gray-500 text-xs">{slotDateFormat(item.slotDate)}</p>
                </div>
                {item.cancelled ? (
                  <p className="text-red-500 text-sm font-semibold">Cancelled</p>
                ) : (
                  <img
                    src={assets.cancel_icon}
                    alt="cancel"
                    onClick={() => cancelAppointment(item._id!)}
                    className="w-6 cursor-pointer hover:scale-110 transition"
                  />
                )}
              </motion.div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No recent appointments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
