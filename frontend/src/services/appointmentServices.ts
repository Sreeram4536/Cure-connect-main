import { api } from "../axios/axiosInstance";
import { APPOINTMENT_API } from "../constants/apiRoutes";

// Book an appointment
export const appointmentBookingAPI = async (
  docId: string,
  slotDate: string,
  slotTime: string,
  token: string
) => {
  return api.post(
    APPOINTMENT_API.BASE,
    { docId, slotDate, slotTime },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Get available slots for a doctor
export const getAvailableSlotsAPI = async (
  docId: string,
  year: number,
  month: number
) => {
  return api.get(`/api/user/doctor/${docId}/slots?year=${year}&month=${month}`);
};

// Get available slots for a specific date
export const getAvailableSlotsForDateAPI = async (
  docId: string,
  dateStr: string,
  token: string
) => {
  return api.get(`/api/user/doctor/${docId}/slots/date?date=${dateStr}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Lock appointment slot
export const lockAppointmentSlotAPI = async ({
  docId,
  slotDate,
  slotTime,
  token,
}: {
  docId: string;
  slotDate: string;
  slotTime: string;
  token: string;
}) => {
  return api.post(
    "/api/user/appointments/lock",
    { docId, slotDate, slotTime },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Cancel appointment lock
export const cancelAppointmentLockAPI = async (
  appointmentId: string,
  token: string
) => {
  return api.patch(
    `/api/user/appointments/${appointmentId}/cancel-lock`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Finalize appointment
export const finalizeAppointmentAPI = async ({
  docId,
  slotDate,
  slotTime,
  payment,
  token,
}: {
  docId: string;
  slotDate: string;
  slotTime: string;
  payment: any;
  token: string;
}) => {
  return api.post(
    "/api/user/appointments/finalize",
    { docId, slotDate, slotTime, payment },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Get appointments with pagination
export const getAppointmentsPaginatedAPI = async (
  page: number = 1,
  limit: number = 10,
  status?: string,
  dateFrom?: string,
  dateTo?: string,
  token?: string,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (status) params.append("status", status);
  if (dateFrom) params.append("dateFrom", dateFrom);
  if (dateTo) params.append("dateTo", dateTo);
  if (sortBy) params.append("sortBy", sortBy);
  if (sortOrder) params.append("sortOrder", sortOrder);

  return api.get(`/api/user/appointments?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

// Cancel appointment
export const cancelAppointmentAPI = async (
  appointmentId: string,
  token: string
) => {
  return api.patch(
    `/api/user/appointments/${appointmentId}/cancel`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Wallet payment methods
export const processWalletPaymentAPI = async (
  docId: string,
  slotDate: string,
  slotTime: string,
  amount: number,
  appointmentId: string,
  token: string
) => {
  return api.post(
    "/api/user/appointments/wallet/payment",
    { docId, slotDate, slotTime, amount, appointmentId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const finalizeWalletPaymentAPI = async (
  appointmentId: string,
  amount: number,
  token: string
) => {
  return api.post(
    "/api/user/appointments/wallet/finalize",
    { appointmentId, amount },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const validateWalletBalanceAPI = async (
  amount: number,
  token: string
) => {
  return api.post(
    "/api/user/wallet/validate-balance",
    { amount },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
