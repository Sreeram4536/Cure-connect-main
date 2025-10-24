import { getApi } from "../axios/axiosInstance";

const api = getApi("user");

// ✅ Get User Wallet Balance
export const getUserWalletBalanceAPI = () => {
  return api.get("/api/user/wallet/balance");
};

// ✅ Get User Wallet Transactions (supports pagination + filters)
export const getUserWalletTransactionsAPI = (
  page: number = 1,
  limit: number = 10,
  token?: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  type?: "credit" | "debit",
  startDate?: string,
  endDate?: string
) => {
  let url = `/api/user/wallet/transactions?page=${page}&limit=${limit}`;

  if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`;
  if (sortOrder) url += `&sortOrder=${encodeURIComponent(sortOrder)}`;
  if (type) url += `&type=${encodeURIComponent(type)}`;
  if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
  if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
  
  // Add cache-busting timestamp
  url += `&_t=${Date.now()}`;

  console.log('User Wallet API URL:', url);
  console.log('User Wallet API Parameters:', { page, limit, sortBy, sortOrder, type, startDate, endDate });

  return api.get(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
};

// ✅ Get User Wallet Details
export const getUserWalletDetailsAPI = () => {
  return api.get("/api/user/wallet/details");
};
