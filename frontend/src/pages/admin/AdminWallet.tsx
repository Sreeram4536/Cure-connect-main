import { useState, useEffect, useContext } from "react";
import { AdminContext } from "../../context/AdminContext";
import { 
  getAdminWalletTransactionsAPI, 
  getAdminWalletDetailsAPI
} from "../../services/adminWalletServices";
import { Wallet, ArrowUpRight, ArrowDownLeft, Calendar, Clock, TrendingUp, Shield, DollarSign } from "lucide-react";

interface WalletTransaction {
  _id: string;
  userId: string;
  userRole: 'user' | 'doctor' | 'admin';
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  appointmentId?: string;
  revenueShare?: {
    doctorAmount?: number;
    adminAmount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface WalletDetails {
  balance: number;
  totalTransactions: number;
}

// Removed management summaries; only show my wallet

const AdminWallet = () => {
  const context = useContext(AdminContext);
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  // Removed doctor/admin wallets overview state
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    type: '' as 'credit' | 'debit' | '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  const [dateError, setDateError] = useState('');
  // Removed tabs; always show my wallet

  if (!context) {
    throw new Error("AdminWallet must be used within an AdminContextProvider");
  }

  const { aToken } = context;

  useEffect(() => {
    if (aToken) {
      fetchWalletDetails();
      fetchTransactions();
    }
  }, [aToken, currentPage, filters]);

  const fetchWalletDetails = async () => {
    try {
      const response = await getAdminWalletDetailsAPI();
      if (response.data.success) {
        setWalletDetails(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching wallet details:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await getAdminWalletTransactionsAPI(
        currentPage, 
        10, 
        undefined, 
        filters.sortBy, 
        filters.sortOrder,
        filters.type || undefined,
        filters.startDate || undefined,
        filters.endDate || undefined
      );
      if (response.data.success) {
        setTransactions(response.data.data.data);
        setTotalPages(response.data.data.totalPages);
        setTotalCount(response.data.data.totalCount);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Removed management fetches

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const validateDates = (startDate: string, endDate: string): string => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      
      if (start > end) {
        return 'Start date cannot be after end date';
      }
      if (start > today) {
        return 'Start date cannot be in the future';
      }
      if (end > today) {
        return 'End date cannot be in the future';
      }
    }
    return '';
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    const error = validateDates(newFilters.startDate, newFilters.endDate);
    setDateError(error);
    setFilters(newFilters);
  };

  if (!aToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please login to view your wallet</h2>
          <p className="text-gray-600">You need to be logged in to access your wallet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Wallet Management</h1>
          <p className="text-gray-600">Manage platform revenue and monitor all wallet activities</p>
        </div>

        {/* Wallet Balance Card */}
        {walletDetails && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-8 h-8" />
                  <h2 className="text-2xl font-bold">Platform Revenue</h2>
                </div>
                <p className="text-3xl font-bold mb-1">{formatAmount(walletDetails.balance)}</p>
                <p className="text-purple-100">Total Transactions: {walletDetails.totalTransactions}</p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Info Card */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-indigo-900">Platform Revenue Share</h3>
              <p className="text-sm text-indigo-700">
                You receive 20% of all appointment fees as platform revenue. Doctors receive 80% of the fees.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Transactions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange({ ...filters, type: e.target.value as 'credit' | 'debit' | '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Types</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleFilterChange({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleFilterChange({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="createdAt">Date</option>
                <option value="amount">Amount</option>
                <option value="type">Type</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
          {dateError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{dateError}</p>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setDateError('');
                setFilters({
                  type: '',
                  startDate: '',
                  endDate: '',
                  sortBy: 'createdAt',
                  sortOrder: 'desc'
                });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={!!dateError}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Tabs removed - only showing My Wallet */}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">My Transaction History</h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No transactions found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue Share
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                transaction.type === 'credit' 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-red-100 text-red-600'
                              }`}>
                                {transaction.type === 'credit' ? (
                                  <ArrowDownLeft className="w-5 h-5" />
                                ) : (
                                  <ArrowUpRight className="w-5 h-5" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {transaction.type === 'credit' ? 'Platform Revenue' : 'Debit'}
                                </div>
                                {/* <div className="text-sm text-gray-500">
                                  {transaction.description}
                                </div> */}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-semibold ${
                              transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'credit' ? '+' : '-'}{formatAmount(transaction.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {transaction.revenueShare && (
                              <div className="text-xs text-gray-500">
                                <div>Doctor: {formatAmount(transaction.revenueShare.doctorAmount || 0)}</div>
                                <div>Admin: {formatAmount(transaction.revenueShare.adminAmount || 0)}</div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-2" />
                              {formatDate(transaction.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-4 h-4 mr-2" />
                              {formatTime(transaction.createdAt)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} transactions
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-2 text-sm font-medium text-gray-700">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminWallet;
