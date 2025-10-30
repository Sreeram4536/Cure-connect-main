import { getApi } from "../axios/axiosInstance";
import { ADMIN_API } from "../constants/apiRoutes";

const api = getApi("admin");

export const adminLoginAPI = async (email: string, password: string) => {
  return await api.post(ADMIN_API.LOGIN, { email, password });
};

// Refresh token
export const refreshAdminAccessTokenAPI = () => {
  return api.post(ADMIN_API.REFRESH);
};

export const logoutAdminAPI = () => {
  return api.post(ADMIN_API.LOGOUT);
};

export const approveDoctorAPI = async (doctorId: string) => {
  return await api.patch(ADMIN_API.APPROVE_DOCTOR(doctorId), {});
};

export const rejectDoctorAPI = async (doctorId: string) => {
  return await api.patch(ADMIN_API.REJECT_DOCTOR(doctorId), {});
};

export const adminAddDoctorAPI = async (formData: FormData) => {
  return await api.post(ADMIN_API.DOCTORS, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getAllDoctorsAPI = async () => {
  return await api.get(ADMIN_API.DOCTORS);
};

export const getDoctorsPaginatedAPI = async (page: number, limit: number, searchQuery: string = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (searchQuery.trim()) {
    params.append('search', searchQuery.trim());
  }
  return await api.get(`${ADMIN_API.DOCTORS}?${params.toString()}`);
};

export const changeAvailabilityAPI = async (
  docId: string,
  isAvailable: boolean,
  
) => {
  return await api.patch(ADMIN_API.CHANGE_AVAILABILITY(docId), { isAvailable });
};

export const getAllUsersAPI = async () => {
  return await api.get(ADMIN_API.USERS);
};

export const getUsersPaginatedAPI = async (page: number, limit: number,searchQuery: string = "") => {
  // return await api.get(`${ADMIN_API.USERS}?page=${page}&limit=${limit}`, {
  //   headers: {
  //     Authorization: `Bearer ${token}`,
  //   },
  // });
   const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  // Add search query if provided
  if (searchQuery.trim()) {
    params.append('search', searchQuery.trim());
  }

  return await api.get(`${ADMIN_API.USERS}?${params.toString()}`);
};

export const toggleUserBlockAPI = async (
  userId: string,
  block: boolean,
  
) => {
  return await api.patch(ADMIN_API.BLOCK_USER(userId), { block });
};

export const getAllAppointmentsAPI = async () => {
  return await api.get(ADMIN_API.APPOINTMENTS);
};

export const getAppointmentsPaginatedAPI = async (page: number, limit: number, searchQuery: string = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (searchQuery.trim()) {
    params.append('search', searchQuery.trim());
  }
  return await api.get(`${ADMIN_API.APPOINTMENTS}?${params.toString()}`);
};

export const adminCancelAppointmentAPI = async (
  appointmentId: string,
  
) => {
  return await api.patch(ADMIN_API.CANCEL_APPOINTMENT(appointmentId), {});
};

export const adminDashboardAPI = async () => {
  return await api.get(ADMIN_API.DASHBOARD);
};

// Admin metrics (daily | weekly | monthly)
export const getAdminMetricsAPI = async (range: 'daily' | 'weekly' | 'monthly' = 'monthly') => {
  // const url = `/api/admin/dashboard/metrics?range=${encodeURIComponent(range)}`;
  return await api.get(ADMIN_API.ADMIN_METRICS(range));
};

export const toggleDoctorBlockAPI = async (
  doctorId: string,
  block: boolean,
  
) => {
  return await api.patch(ADMIN_API.BLOCK_DOCTOR(doctorId), { block });
};
