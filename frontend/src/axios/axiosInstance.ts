
import axios from "axios";
import { getUserAccessToken, updateUserAccessToken } from "../context/tokenManagerUser";
import { getAdminAccessToken, updateAdminAccessToken } from "../context/tokenManagerAdmin";
import { getDoctorAccessToken, updateDoctorAccessToken } from "../context/tokenManagerDoctor";
import { showErrorToast } from "../utils/errorHandler";


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
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
    withCredentials: true,
  });

  instance.interceptors.request.use(
    (config) => {
      const token = roleTokenMap[role].get();
      console.log(`Axios ${role} interceptor: Token retrieved:`, token ? 'Present' : 'Missing');
      console.log(`Axios ${role} interceptor: Making request to:`, config.url);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`Axios ${role} interceptor: Authorization header set`);
      } else {
        console.log(`Axios ${role} interceptor: No token available, request will be unauthenticated`);
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

      if (!(window as any)._blockedRedirectTriggered) {
  (window as any)._blockedRedirectTriggered = false;
}

       if (err.response?.status === 403 && err.response?.data?.blocked) {
        if (typeof (window as any)._blockedRedirectTriggered === "undefined") {
    (window as any)._blockedRedirectTriggered = false;
  }

  // Prevent duplicate handling
  if ((window as any)._blockedRedirectTriggered) {
    return Promise.reject(err);
  }

  // Immediately lock further executions
  (window as any)._blockedRedirectTriggered = true;
        console.log(`${role} is blocked by admin`);
        
        // Clear token
        roleTokenMap[role].set(null);
        
        // Show error toast
        showErrorToast(err);
        
        // Role-based redirect paths
        const redirectPaths: Record<ApiRole, string> = {
          user: "/login",
          admin: "/admin/login",
          doctor: "/doctor/login",
        };
        
        // Clear all stored data
        localStorage.clear();
        sessionStorage.clear();

         document.cookie.split(";").forEach((cookie) => {
    document.cookie = cookie
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
        
        // Redirect to appropriate login page
        setTimeout(() => {
          // window.location.href = redirectPaths[role];
          window.location.replace(redirectPaths[role]); 
        }, 1000); // Small delay to show toast
        
        return Promise.reject(err);
      }

     
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
         
          // showErrorToast(refreshErr);
          return Promise.reject(refreshErr);
        }
      }

  
      
      // showErrorToast(err);
      return Promise.reject(err);
    }
  );

  return instance;
};


export const api = getApi("user");

