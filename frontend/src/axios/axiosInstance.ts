import axios from "axios";
import { getUserAccessToken, updateUserAccessToken } from "../context/tokenManagerUser";
import { getAdminAccessToken, updateAdminAccessToken } from "../context/tokenManagerAdmin";
import { getDoctorAccessToken, updateDoctorAccessToken } from "../context/tokenManagerDoctor";

export type ApiRole = "user" | "admin" | "doctor";

type TokenGetters = {
  get: () => string | null;
  set: (token: string | null) => void;
};

const roleTokenMap: Record<ApiRole, TokenGetters> = {
  user: { get: getUserAccessToken, set: updateUserAccessToken },
  admin: { get: getAdminAccessToken, set: updateAdminAccessToken },
  doctor: { get: getDoctorAccessToken, set: updateDoctorAccessToken },
};

const refreshEndpointByRole: Record<ApiRole, string> = {
  user: "/api/user/refresh-token",
  admin: "/api/admin/refresh-token",
  doctor: "/api/doctor/refresh-token",
};


const extractTokenFromRefreshResponse = (role: ApiRole, data: any): string | null => {
  if (!data) return null;
  switch (role) {
    case "user":
      return data.token ?? null;
    case "admin":
      return data.token ?? (data.success ? data.token : null);
    case "doctor":
      return data.accessToken ?? null;
  }
};

export const getApi = (role: ApiRole) => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true,
  });

  instance.interceptors.request.use(
    (config) => {
      const token = roleTokenMap[role].get();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (res) => {
      const newToken = (res.headers as any)["new-access-token"];
      if (newToken) {
        roleTokenMap[role].set(newToken);
      }
      return res;
    },
    async (err) => {
      const originalRequest = err.config || {};
      if (err.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshRes = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}${refreshEndpointByRole[role]}`,
            {},
            { withCredentials: true }
          );

          const newToken = extractTokenFromRefreshResponse(role, refreshRes.data);
          if (!newToken) throw new Error("Token refresh failed");

          roleTokenMap[role].set(newToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch (refreshErr) {
          roleTokenMap[role].set(null);
          return Promise.reject(refreshErr);
        }
      }
      return Promise.reject(err);
    }
  );

  return instance;
};


export const api = getApi("user");

