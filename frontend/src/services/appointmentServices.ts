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

// Get paginated appointments
export const getAppointmentsPaginatedAPI = async (
  token: string,
  page: number,
  limit: number,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  status?: string,
  dateFrom?: string,
  dateTo?: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  if (status) params.append('status', status);
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  return api.get(`${APPOINTMENT_API.BASE}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Cancel an appointment
export const cancelAppointmentAPI = async (
  appointmentId: string,
  token: string
) => {
  return api.patch(
    APPOINTMENT_API.CANCEL(appointmentId),
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
};


export const getAvailableSlotsAPI = async (
  doctorId: string,
  year: number,
  month: number
) => {
  const response = await api.get(`/api/user/doctor/${doctorId}/slots`, {
    params: { year, month },
  });
  return response.data.slots;
};

export const getAvailableSlotsForDateAPI = async (
  doctorId: string,
  date: string,
  token: string
) => {
  const response = await api.get(`/api/user/doctor/${doctorId}/slots/date`, {
    params: { date },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Finalize appointment after payment
export const finalizeAppointmentAPI = async ({ docId, slotDate, slotTime, payment, token }: {
  docId: string;
  slotDate: string;
  slotTime: string;
  payment: any;
  token: string;
}) => {
  return api.post(
    APPOINTMENT_API.FINALIZE,
    { docId, slotDate, slotTime, payment },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// Lock a slot before payment
export const lockAppointmentSlotAPI = async ({ docId, slotDate, slotTime, token }: {
  docId: string;
  slotDate: string;
  slotTime: string;
  token: string;
}) => {
  return api.post(
    '/api/user/appointments/lock',
    { docId, slotDate, slotTime },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const cancelAppointmentLockAPI = async (appointmentId: string, token: string) => {
  return api.patch(`/api/user/appointments/${appointmentId}/cancel-lock`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
