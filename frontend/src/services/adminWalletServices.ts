import { getApi } from "../axios/axiosInstance";

const api = getApi("admin");

// Get admin wallet balance
export const getAdminWalletBalanceAPI = () => {
  return api.get("/api/admin-wallet/balance");
};

// Get admin wallet transactions
export const getAdminWalletTransactionsAPI = (page: number = 1, limit: number = 10, token?: string, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
  let url = `/api/admin-wallet/transactions?page=${page}&limit=${limit}`;
  if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`;
  if (sortOrder) url += `&sortOrder=${encodeURIComponent(sortOrder)}`;
  return api.get(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
};

// Get admin wallet details
export const getAdminWalletDetailsAPI = () => {
  return api.get("/api/admin-wallet/details");
};

// Get admin wallet DTO (complete wallet info)
export const getAdminWalletDTOAPI = () => {
  return api.get("/api/admin-wallet/wallet");
};

// Get all doctor wallets (admin management)
export const getAllDoctorWalletsAPI = (page: number = 1, limit: number = 10) => {
  return api.get(`/api/admin-wallet/doctors?page=${page}&limit=${limit}`);
};

// Get all admin wallets (admin management)
export const getAllAdminWalletsAPI = (page: number = 1, limit: number = 10) => {
  return api.get(`/api/admin-wallet/admins?page=${page}&limit=${limit}`);
};
