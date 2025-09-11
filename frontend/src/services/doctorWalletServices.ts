import { getApi } from "../axios/axiosInstance";

const api = getApi("doctor");

// Get doctor wallet balance
export const getDoctorWalletBalanceAPI = () => {
  return api.get("/api/doctor-wallet/balance");
};

// Get doctor wallet transactions
export const getDoctorWalletTransactionsAPI = (page: number = 1, limit: number = 10, token?: string, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
  let url = `/api/doctor-wallet/transactions?page=${page}&limit=${limit}`;
  if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`;
  if (sortOrder) url += `&sortOrder=${encodeURIComponent(sortOrder)}`;
  return api.get(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
};

// Get doctor wallet details
export const getDoctorWalletDetailsAPI = () => {
  return api.get("/api/doctor-wallet/details");
};

// Get doctor wallet DTO (complete wallet info)
export const getDoctorWalletDTOAPI = () => {
  return api.get("/api/doctor-wallet/wallet");
};
