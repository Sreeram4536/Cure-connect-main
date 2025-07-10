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

// Get all appointments
export const getAppointmentsAPI = async (token: string) => {
  return api.get(APPOINTMENT_API.BASE, {
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
