import { doctorApi as api } from "../axios/doctorAxiosInstance";
import { DOCTOR_API } from "../constants/apiRoutes";

// Get all doctors
export const getDoctorsAPI = () => {
  return api.get(DOCTOR_API.BASE);
};

// Get paginated doctors
export const getDoctorsPaginatedAPI = (page: number, limit: number, speciality?: string, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
  let url = `${DOCTOR_API.DOCTORS}?page=${page}&limit=${limit}`;
  if (speciality) url += `&speciality=${encodeURIComponent(speciality)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`;
  if (sortOrder) url += `&sortOrder=${encodeURIComponent(sortOrder)}`;
  return api.get(url);
};

// Register doctor
export const registerDoctorAPI = (formData: FormData) => {
  return api.post(DOCTOR_API.REGISTER, formData);
};

// Doctor login
export const doctorLoginAPI = (email: string, password: string) => {
  return api.post(DOCTOR_API.LOGIN, { email, password });
};

// Doctor logout
export const logoutDoctorAPI = () => {
  return api.post(DOCTOR_API.LOGOUT);
};

// Refresh token
export const refreshDoctorAccessTokenAPI = () => {
  return api.post(DOCTOR_API.REFRESH);
};

// Get appointments for doctor
export const getDoctorAppointmentsAPI = () => {
  return api.get(DOCTOR_API.APPOINTMENTS);
};

// Get paginated appointments for doctor
export const getDoctorAppointmentsPaginatedAPI = (page: number, limit: number) => {
  return api.get(`${DOCTOR_API.APPOINTMENTS}?page=${page}&limit=${limit}`);
};

// Confirm appointment
export const AppointmentConfirmAPI = (appointmentId: string) => {
  return api.patch(`/api/doctor/appointment/confirm/${appointmentId}`);
};

// Cancel appointment
export const AppointmentCancelAPI = (appointmentId: string, page?: number, limit?: number) => {
  let url = `/api/doctor/appointments/${appointmentId}/cancel`;
  if (page && limit) {
    url += `?page=${page}&limit=${limit}`;
  }
  return api.patch(url);
};

export const ReleaseSlotLockAPI = (appointmentId: string) => {
  return api.patch(`/api/doctor/slot/release/${appointmentId}`);
};

// Get doctor profile
export const getDoctorProfileAPI = () => {
  return api.get(DOCTOR_API.PROFILE);
};

// Get doctor dashboard data
export const doctorDashboardAPI = () => {
  return api.get("/api/doctor/dashboard");
};

// Update doctor profile
export const updateDoctorProfileAPI = (
  formData: any,
  image: File | null
) => {
  const data = new FormData();

  data.append("doctId", formData._id);
  data.append("name", formData.name);
  data.append("speciality", formData.speciality);
  data.append("degree", formData.degree);
  data.append("experience", String(formData.experience));
  data.append("about", formData.about);
  data.append("fees", String(formData.fees));
  data.append("address", JSON.stringify(formData.address));

  if (image) {
    data.append("image", image);
  }

  return api.patch(DOCTOR_API.PROFILE_UPDATE, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};


// Fetch slots for a month
// export const getDoctorSlotsAPI = (year: number, month: number) => {
//   return api.get(`api/doctor/slots?year=${year}&month=${month}`);
// };

// // Add/update slots for a date
// export const addDoctorSlotsAPI = (
//   date: string,
//   slots: { start: string; end: string }[],
//   isCancelled: boolean
// ) => {
//   return api.post("api/doctor/slots", { date, slots, isCancelled });
// };

export const getDoctorSlotRuleAPI = () => {
  return api.get(DOCTOR_API.SLOTS);
};
export const setDoctorSlotRuleAPI = (rule: any) => {
  return api.post(DOCTOR_API.SLOTS, rule);
};

export const getDoctorPreviewSlotsAPI = (year: number, month: number) => {
  return api.get(`/api/doctor/slots?year=${year}&month=${month}`);
};

export const getDoctorSlotsForDateAPI = (date: string) => {
  return api.get(`/api/doctor/slots/date?date=${date}`);
};

// Get top doctors with filtering and limiting
export const getTopDoctorsAPI = (status = "approved", limit = 10) => {
  return api.get(`/api/doctor/top?status=${status}&limit=${limit}`);
};

export const updateDoctorCustomSlotAPI = (date: string, start: string, duration: number) => {
  return api.patch(DOCTOR_API.UPDATE_CUSTOM_SLOT, { date, start, duration });
};

export const cancelDoctorCustomSlotAPI = (date: string, start: string) => {
  return api.patch(DOCTOR_API.CANCEL_CUSTOM_SLOT, { date, start });
};

export const removeDoctorLeaveAPI = (date: string) => {
  return api.delete(`/api/doctor/leave/remove/${date}`);
};

export const setDoctorLeaveAPI = (date: string, leaveType: 'full' | 'break' | 'custom', slots?: any[]) => {
  return api.post('/api/doctor/leave/set', { date, leaveType, slots });
};

