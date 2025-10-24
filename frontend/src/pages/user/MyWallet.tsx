import { useState, useEffect, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { Wallet, ArrowUpRight, ArrowDownLeft, Calendar, Clock } from "lucide-react";
import {
  getUserWalletBalanceAPI,
  getUserWalletTransactionsAPI,
  getUserWalletDetailsAPI,
} from "../../services/userWalletServices";

interface WalletTransaction {
  _id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  appointmentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface WalletDetails {
  balance: number;
  totalTransactions: number;
}

const MyWallet = () => {
  const context = useContext(AppContext);
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
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



  if (!context) {
    throw new Error("MyWallet must be used within an AppContextProvider");
  }

  const { token } = context;

  useEffect(() => {
    if (token) {
      fetchWalletDetails();
      fetchTransactions();
    }
  }, [token, currentPage, filters]);

  // Debug effect to log filter changes
  useEffect(() => {
    console.log('Filters changed:', filters);
  }, [filters]);

  const fetchWalletDetails = async () => {
    try {
      const response = await getUserWalletDetailsAPI();
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
      console.log('Fetching transactions with filters:', filters);
      console.log('API call parameters:', {
        currentPage,
        limit: 10,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        type: filters.type || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      });
      
      const response = await getUserWalletTransactionsAPI(
        currentPage,
        10,
        undefined,
        filters.sortBy,
        filters.sortOrder,
        filters.type || undefined,
        filters.startDate || undefined,
        filters.endDate || undefined
      );
      console.log('API Response:', response.data);
      if (response.data.success) {
        setTransactions(response.data.data.data);
        setTotalPages(response.data.data.totalPages);
        setTotalCount(response.data.data.totalCount);
        console.log('Transactions set:', response.data.data.data);
        console.log('Transaction types:', response.data.data.data.map(tx => tx.type));
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  

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
    console.log('Filter change:', newFilters);
    const error = validateDates(newFilters.startDate, newFilters.endDate);
    setDateError(error);
    setFilters(newFilters);
    console.log('Filters updated to:', newFilters);
    // Reset to page 1 when filters change
    setCurrentPage(1);
  };

  if (!token) {
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <p className="text-gray-600">Manage your wallet balance and view transaction history</p>
        </div>

        {/* Wallet Balance Card */}
        {walletDetails && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="w-8 h-8" />
                  <h2 className="text-2xl font-bold">Wallet Balance</h2>
                </div>
                <p className="text-3xl font-bold mb-1">{formatAmount(walletDetails.balance)}</p>
                <p className="text-blue-100">Total Transactions: {walletDetails.totalTransactions}</p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Wallet className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        )}

       

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Transactions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange({ ...filters, type: e.target.value as 'credit' | 'debit' | '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleFilterChange({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Transaction History</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
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
                                {transaction.type === 'credit' ? 'Credit' : 'Debit'}
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

export default MyWallet; 