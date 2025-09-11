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

export const approveDoctorAPI = async (doctorId: string, token: string) => {
  return await api.patch(ADMIN_API.APPROVE_DOCTOR(doctorId), {}, {
    headers: {
  Authorization: `Bearer ${token}`,
},
  });
};

export const rejectDoctorAPI = async (doctorId: string, token: string) => {
  return await api.patch(ADMIN_API.REJECT_DOCTOR(doctorId), {}, {
    headers: {
  Authorization: `Bearer ${token}`,
},
  });
};

export const adminAddDoctorAPI = async (formData: FormData, token: string) => {
  return await api.post(ADMIN_API.DOCTORS, formData, {
   headers: {
  Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getAllDoctorsAPI = async (token: string) => {
  return await api.get(ADMIN_API.DOCTORS, {
    headers: {
  Authorization: `Bearer ${token}`,
},
  });
};

export const getDoctorsPaginatedAPI = async (page: number, limit: number, token: string, searchQuery: string = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (searchQuery.trim()) {
    params.append('search', searchQuery.trim());
  }
  return await api.get(`${ADMIN_API.DOCTORS}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const changeAvailabilityAPI = async (
  docId: string,
  isAvailable: boolean,
  token: string
) => {
  return await api.patch(ADMIN_API.CHANGE_AVAILABILITY(docId), { isAvailable }, {
    headers: {
  Authorization: `Bearer ${token}`,
},
  });
};

export const getAllUsersAPI = async (token: string) => {
  return await api.get(ADMIN_API.USERS, {
    headers: {
  Authorization: `Bearer ${token}`,
},
  });
};

export const getUsersPaginatedAPI = async (page: number, limit: number, token: string,searchQuery: string = "") => {
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

  return await api.get(`${ADMIN_API.USERS}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const toggleUserBlockAPI = async (
  userId: string,
  block: boolean,
  token: string
) => {
  return await api.patch(ADMIN_API.BLOCK_USER(userId), { block }, {
    headers: {
  Authorization: `Bearer ${token}`,
},
  });
};

export const getAllAppointmentsAPI = async (token: string) => {
  return await api.get(ADMIN_API.APPOINTMENTS, {
    headers: {
  Authorization: `Bearer ${token}`,
},
  });
};

export const getAppointmentsPaginatedAPI = async (page: number, limit: number, token: string, searchQuery: string = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (searchQuery.trim()) {
    params.append('search', searchQuery.trim());
  }
  return await api.get(`${ADMIN_API.APPOINTMENTS}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const adminCancelAppointmentAPI = async (
  appointmentId: string,
  token: string
) => {
  return await api.patch(ADMIN_API.CANCEL_APPOINTMENT(appointmentId), {}, {
    headers: {
  Authorization: `Bearer ${token}`,
},
  });
};

export const adminDashboardAPI = async (token: string) => {
  return await api.get(ADMIN_API.DASHBOARD, {
    headers: {
  Authorization: `Bearer ${token}`,
},
  });
};

// Admin metrics (daily | weekly | monthly)
export const getAdminMetricsAPI = async (range: 'daily' | 'weekly' | 'monthly' = 'monthly', token?: string) => {
  const url = `/api/admin/dashboard/metrics?range=${encodeURIComponent(range)}`;
  return await api.get(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
};

export const toggleDoctorBlockAPI = async (
  doctorId: string,
  block: boolean,
  token: string
) => {
  return await api.patch(ADMIN_API.BLOCK_DOCTOR(doctorId), { block }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
