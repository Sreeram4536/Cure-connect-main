import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/admin/assets";
import type { AppointmentTypes } from "../../types/appointment";
import { motion } from "framer-motion";
import { getDoctorMetricsAPI } from "../../services/doctorServices";
import { getDoctorWalletTransactionsAPI } from "../../services/doctorWalletServices";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from "recharts";

type Range = 'daily' | 'weekly' | 'monthly';
interface MetricsPoint { label: string; value: number }
interface LatestActivityItem { amount: number; type: 'credit' | 'debit'; description: string; createdAt: string }
interface WalletTransaction { _id: string; amount: number; type: 'credit' | 'debit'; description: string; createdAt: string; appointmentId?: string }
interface MetricsResponse {
  totals: { totalEarnings: number; totalAppointments: number };
  timeSeries: MetricsPoint[];
  latestActivity: LatestActivityItem[];
}

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const context = useContext(DoctorContext);
  const appContext = useContext(AppContext);

  console.log("DoctorDashboard: Component is rendering");

  if (!context) throw new Error("DoctorContext must be used within DoctorContextProvider");
  if (!appContext) throw new Error("AppContext must be used within AppContextProvider");

  const { dToken, dashData, getDashData, cancelAppointment, loading } = context;
  const { slotDateFormat } = appContext;

  const [range, setRange] = useState<Range>('monthly');
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [latestTransactions, setLatestTransactions] = useState<WalletTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);

  useEffect(() => {
    if (dToken) {
      console.log("Doctor dashboard: Getting dash data with token:", dToken);
      getDashData();
    } else {
      console.log("Doctor dashboard: No token available");
    }
  }, [dToken]);

  useEffect(() => {
    const load = async () => {
      try { 
        console.log('Loading doctor metrics for range:', range, 'with token:', !!dToken);
        const { data } = await getDoctorMetricsAPI(range, dToken); 
        console.log('Doctor metrics response:', data);
        if (data.success) setMetrics(data.data as MetricsResponse); 
      } catch (error) { 
        console.error('Error loading doctor metrics:', error); 
      }
    };
    if (dToken) load();
  }, [dToken, range]);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoadingTransactions(true);
        console.log('Loading doctor transactions with token:', !!dToken);
        const { data } = await getDoctorWalletTransactionsAPI(1, 5, dToken);
        console.log('Doctor transactions response:', data);
        if (data.success) setLatestTransactions(data.data.data || []);
      } catch (error) {
        console.error('Error loading doctor transactions:', error);
      } finally {
        setLoadingTransactions(false);
      }
    };
    if (dToken) loadTransactions();
  }, [dToken]);

  const earningsSeries = useMemo(() => (metrics?.timeSeries || []).map(p => ({ ...p })), [metrics]);

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
            count: `₹${(metrics?.totals.totalEarnings ?? dashData?.totalEarnings ?? 0).toLocaleString()}`,
            label: "Total Earnings",
            icon: assets.earning_icon,
            gradient: "from-emerald-500 to-teal-600",
            bgGradient: "from-emerald-50 to-teal-50",
            borderColor: "border-emerald-200",
            textColor: "text-emerald-800",
            iconBg: "bg-emerald-500",
            path: "/doctor/appointments",
          },
          {
            count: metrics?.totals.totalAppointments ?? dashData?.totalAppointments ?? 0,
            label: "Confirmed Appointments",
            icon: assets.appointments_icon,
            gradient: "from-blue-500 to-indigo-600",
            bgGradient: "from-blue-50 to-indigo-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-800",
            iconBg: "bg-blue-500",
            path: "/doctor/appointments",
          },
          {
            count: dashData.pendingAppointments || 0,
            label: "Pending Appointments",
            icon: assets.patients_icon,
            gradient: "from-orange-500 to-red-600",
            bgGradient: "from-orange-50 to-red-50",
            borderColor: "border-orange-200",
            textColor: "text-orange-800",
            iconBg: "bg-orange-500",
            path: "/doctor/appointments",
          }
        ].map((card, idx) => (
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            key={idx}
            onClick={() => navigate(card.path)}
            className={`cursor-pointer bg-gradient-to-br ${card.bgGradient} ${card.borderColor} border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${card.textColor}`}>{card.label}</p>
                <p className={`text-3xl font-bold mt-1 ${card.textColor}`}>{card.count}</p>
              </div>
              <div className={`w-12 h-12 ${card.iconBg} rounded-full flex items-center justify-center shadow-md`}>
                <img src={card.icon} alt={card.label} className="w-6 h-6 filter brightness-0 invert" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Range Switcher */}
      <div className="flex items-center justify-end">
        <div className="inline-flex rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
          {(['daily','weekly','monthly'] as Range[]).map(r => (
            <button 
              key={r} 
              onClick={() => setRange(r)} 
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                range===r 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl shadow-lg border border-emerald-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"></div>
            <p className="font-bold text-gray-800 text-lg">Earnings Trend ({range})</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Earnings (₹)" 
                  stroke="url(#earningsGradient)"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                />
                <defs>
                  <linearGradient id="earningsGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
            <p className="font-bold text-gray-800 text-lg">Appointments ({range})</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name="Appointments" 
                  fill="url(#appointmentsGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="appointmentsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Latest Transactions */}
      <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-lg border border-green-100 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">💰</span>
          </div>
          <p className="font-bold text-gray-800 text-lg">Latest Transactions</p>
        </div>
        <div className="divide-y divide-green-100">
          {loadingTransactions ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-2">Loading transactions...</p>
            </div>
          ) : latestTransactions.length > 0 ? (
            latestTransactions.map((transaction, index) => (
              <motion.div
                key={transaction._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'credit' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  <span className="text-lg">
                    {transaction.type === 'credit' ? '↗' : '↙'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{transaction.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()} at {new Date(transaction.createdAt).toLocaleTimeString()}
                  </p>
                  {transaction.appointmentId && (
                    <p className="text-xs text-gray-400">Appointment #{transaction.appointmentId.slice(-6)}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{transaction.type}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-lg font-medium">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">Your earnings will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Latest Appointments */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <img src={assets.list_icon} alt="" className="w-5 h-5 filter brightness-0 invert" />
          </div>
          <p className="font-bold text-gray-800 text-lg">Recent Appointments</p>
        </div>
        <div className="divide-y divide-gray-100">
          {dashData.latestAppointments && dashData.latestAppointments.length > 0 ? (
            dashData.latestAppointments.map((item: AppointmentTypes, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-200"
              >
                <div className="relative">
                  <img 
                    src={item.userData?.image || "/default-avatar.png"} 
                    className="w-12 h-12 rounded-full border-2 border-white shadow-md" 
                    alt="" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/default-avatar.png";
                    }}
                  />
                  {!item.cancelled && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{item.userData?.name || 'Unknown'}</p>
                  <p className="text-gray-500 text-sm">{slotDateFormat(item.slotDate)}</p>
                  <p className="text-xs text-gray-400">Appointment #{item._id?.slice(-6)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.cancelled ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      Cancelled
                    </span>
                  ) : (
                    <button
                      onClick={() => cancelAppointment(item._id!)}
                      className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full hover:bg-red-200 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <p className="text-lg font-medium">No recent appointments</p>
              <p className="text-sm text-gray-400 mt-1">Your upcoming appointments will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
