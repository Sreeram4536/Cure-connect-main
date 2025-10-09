import { getApi } from "../axios/axiosInstance";
const api = getApi("user");
import { APPOINTMENT_API } from "../constants/apiRoutes";
import { getApi as getDoctorApi } from "../axios/axiosInstance";
const doctorApi = getDoctorApi("doctor");

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
    {}
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
  return api.get(`/api/user/doctor/${docId}/slots/date?date=${dateStr}`);
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
    {}
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
    {}
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
    {}
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

  return api.get(`/api/user/appointments?${params.toString()}`);
};

// Cancel appointment
export const cancelAppointmentAPI = async (
  appointmentId: string,
  token: string
) => {
  return api.patch(
    `/api/user/appointments/${appointmentId}/cancel`,
    {},
    {}
  );
};

// Feedback & Prescription
export const submitFeedbackAPI = (appointmentId: string, rating: number, comment?: string) =>
  api.post(`/api/user/appointments/${appointmentId}/feedback`, { rating, comment });

export const createPrescriptionAPI = (
  appointmentId: string,
  userId: string,
  items: { name: string; dosage: string; instructions?: string }[],
  notes?: string
) => doctorApi.post(`/api/doctor/appointments/${appointmentId}/prescription`, { userId, items, notes });

export const completeAppointmentAPI = (appointmentId: string) =>
  doctorApi.patch(`/api/doctor/appointments/${appointmentId}/complete`, {});

export const getPrescriptionByAppointmentAPI = (appointmentId: string) =>
  api.get(`/api/user/appointments/${appointmentId}/prescription`);

export const listUserPrescriptionsAPI = () => api.get(`/api/user/prescriptions`);

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
    {}
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
    {}
  );
};

export const validateWalletBalanceAPI = async (
  amount: number,
  token: string
) => {
  return api.post(
    "/api/user/wallet/validate-balance",
    { amount },
    {}
  );
};

// Doctor feedbacks
export const getDoctorFeedbacksAPI = async (
  doctorId: string,
  page: number = 1,
  limit: number = 5
) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return api.get(`/api/user/doctor/${doctorId}/feedbacks?${params.toString()}`);
};
