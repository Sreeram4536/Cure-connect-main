import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/admin/assets";
import type { AppointmentTypes } from "../../types/appointment";
import { motion } from "framer-motion";
import { getAdminMetricsAPI } from "../../services/adminServices";
import { getAdminWalletTransactionsAPI } from "../../services/adminWalletServices";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Range = 'daily' | 'weekly' | 'monthly';

interface MetricsPoint { label: string; value: number }
interface LatestActivityItem { amount: number; type: 'credit' | 'debit'; description: string; createdAt: string }
interface WalletTransaction { _id: string; amount: number; type: 'credit' | 'debit'; description: string; createdAt: string; appointmentId?: string }
interface MetricsResponse {
  totals: { totalRevenue: number; totalAppointments: number };
  timeSeries: MetricsPoint[];
  latestActivity: LatestActivityItem[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const context = useContext(AdminContext);
  const appContext = useContext(AppContext);

  if (!context) throw new Error("AdminContext must be used within AdminContextProvider");
  if (!appContext) throw new Error("AppContext must be used within AppContextProvider");

  const { aToken, dashData, getDashData, cancelAppointment } = context;
  const { slotDateFormat } = appContext;

  const [range, setRange] = useState<Range>("monthly");
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [latestTransactions, setLatestTransactions] = useState<WalletTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);

  const COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4", "#84CC16"]; 

  useEffect(() => {
    if (aToken) getDashData();
  }, [aToken]);

  useEffect(() => {
    if (!aToken) navigate("/admin/login");
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingMetrics(true);
        console.log('Loading admin metrics for range:', range, 'with token:', !!aToken);
        const { data } = await getAdminMetricsAPI(range);
        console.log('Admin metrics response:', data);
        if (data.success) setMetrics(data.data as MetricsResponse);
      } catch (error) {
        console.error('Error loading admin metrics:', error);
      } finally {
        setLoadingMetrics(false);
      }
    };
    if (aToken) load();
  }, [aToken, range]);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoadingTransactions(true);
        console.log('Loading admin transactions with token:', !!aToken);
        const { data } = await getAdminWalletTransactionsAPI(1, 5, aToken);
        console.log('Admin transactions response:', data);
        if (data.success) setLatestTransactions(data.data.data || []);
      } catch (error) {
        console.error('Error loading admin transactions:', error);
      } finally {
        setLoadingTransactions(false);
      }
    };
    if (aToken) loadTransactions();
  }, [aToken]);

  const revenueSeries = useMemo(() => (metrics?.timeSeries || []).map(p => ({ ...p })), [metrics]);
  const latestActivity = metrics?.latestActivity || [];

  return (
    dashData && (
      <div className="m-5 space-y-10">
        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            whileHover={{ scale: 1.03, y: -2 }} 
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Total Revenue</p>
                <p className="text-3xl font-bold mt-1 text-emerald-800">₹{(metrics?.totals.totalRevenue ?? 0).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">₹</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.03, y: -2 }} 
            className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Appointments</p>
                <p className="text-3xl font-bold mt-1 text-blue-800">{(metrics?.totals.totalAppointments ?? 0).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">📅</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.03, y: -2 }} 
            className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Doctors</p>
                <p className="text-3xl font-bold mt-1 text-purple-800">{dashData.totalDoctors}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">👨‍⚕️</span>
              </div>
            </div>
          </motion.div>
          
            <motion.div
            whileHover={{ scale: 1.03, y: -2 }} 
            className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Patients</p>
                <p className="text-3xl font-bold mt-1 text-orange-800">{dashData.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">👥</span>
              </div>
              </div>
            </motion.div>
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
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-100 p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              <p className="font-bold text-gray-800 text-lg">Revenue Trend ({range})</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueSeries}>
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
                    name="Revenue (₹)" 
                    fill="url(#revenueGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-lg border border-purple-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
              <p className="font-bold text-gray-800 text-lg">Latest Activity</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    dataKey="amount" 
                    data={latestActivity} 
                    nameKey="type" 
                    outerRadius={80} 
                    label={({ name, value }) => `${name}: ₹${value}`}
                    labelLine={false}
                  >
                    {latestActivity.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                </PieChart>
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
                    {/* {transaction.appointmentId && (
                      <p className="text-xs text-gray-400">Appointment #{transaction.appointmentId.slice(-6)}</p>
                    )} */}
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
                <p className="text-sm text-gray-400 mt-1">Your wallet transactions will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Latest Bookings */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <img src={assets.list_icon} alt="" className="w-5 h-5 filter brightness-0 invert" />
            </div>
            <p className="font-bold text-gray-800 text-lg">Latest Bookings</p>
          </div>
          <div className="divide-y divide-gray-100">
            {dashData.latestAppointments.map((item: AppointmentTypes, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
              >
                <div className="relative">
                  <img src={item.docData.image} className="w-12 h-12 rounded-full border-2 border-white shadow-md" alt="" />
                  {!item.cancelled && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{item.docData.name}</p>
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
            ))}
          </div>
        </div>
      </div>
    )
  );
};

export default AdminDashboard;
