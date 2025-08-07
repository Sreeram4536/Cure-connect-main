import axios from "axios";
import {
  getAdminAccessToken,
  updateAdminAccessToken,
} from "../context/tokenManagerAdmin";

export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

adminApi.interceptors.request.use(
  (config) => {
    const token = getAdminAccessToken();
    console.log("AdminAPI: Getting admin token:", token ? "Present" : "Not present");
    if (token) {
      console.log("AdminAPI: Adding admin token to headers");
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log("AdminAPI: No admin token found, making request without auth header");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("AdminAPI: Attempting to refresh admin token");
        const refreshRes = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshRes.data.token;
        console.log("AdminAPI: Token refresh successful");
        updateAdminAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return adminApi(originalRequest);
      } catch (refreshErr) {
        console.error("AdminAPI: Token refresh failed", refreshErr);
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);
