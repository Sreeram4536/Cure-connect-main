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

const getBlockedFlagKey = (role: ApiRole) => `_${role}BlockedRedirectTriggered`;

// ✅ Helper function to check if current route belongs to this role
const isOnRoleRoutes = (role: ApiRole): boolean => {
  const currentPath = window.location.pathname;
  
  switch (role) {
    case "admin":
      return currentPath.startsWith("/admin");
    case "doctor":
      return currentPath.startsWith("/doctor");
    case "user":
      // User routes are everything that's NOT admin or doctor
      return !currentPath.startsWith("/admin") && !currentPath.startsWith("/doctor");
    default:
      return false;
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

      // ✅ CRITICAL: Check if we're on this role's routes FIRST - before ANY error handling
      const onCorrectRoutes = isOnRoleRoutes(role);
      
      // Handle 403 blocked error - ONLY if on correct role's routes
      if (err.response?.status === 403 && err.response?.data?.blocked) {
        // ✅ CRITICAL: Only handle blocked error if we're on this role's routes
        if (!onCorrectRoutes) {
          console.log(`${role} blocked error occurred but not on ${role} routes, silently rejecting...`);
          return Promise.reject(err);
        }

        const blockedFlagKey = getBlockedFlagKey(role);
        const blockedToastKey = `${blockedFlagKey}_toast_shown`;
        
        // Initialize flags if not exists
        if (typeof (window as any)[blockedFlagKey] === "undefined") {
          (window as any)[blockedFlagKey] = false;
        }
        if (typeof (window as any)[blockedToastKey] === "undefined") {
          (window as any)[blockedToastKey] = false;
        }

        // Prevent duplicate handling for this role
        if ((window as any)[blockedFlagKey]) {
          console.log(`${role} blocked handler already executed, skipping...`);
          return Promise.reject(err);
        }

        // Lock further executions for this role
        (window as any)[blockedFlagKey] = true;
        console.log(`${role} is blocked by admin - handling on ${role} routes`);
        
        // Remove ONLY this specific role's token
        const tokenKey = `${role}AccessToken`;
        localStorage.removeItem(tokenKey);
        roleTokenMap[role].set(null);

        const redirectPaths: Record<ApiRole, string> = {
          user: "/login",
          admin: "/admin/login",
          doctor: "/doctor/login",
        };

        // Show error toast ONLY ONCE - check if already shown
        if (!(window as any)[blockedToastKey]) {
          (window as any)[blockedToastKey] = true;
          showErrorToast(err);
        }
        
        setTimeout(() => {
          window.location.replace(redirectPaths[role]);
        }, 800);
        
        return Promise.reject(err);
      }

      // For other errors, check if we're on correct routes
      if (!onCorrectRoutes) {
        console.log(`${role} interceptor: Error occurred but not on ${role} routes, silently rejecting...`);
        // Silently reject without any toasts, redirects, or token clearing
        return Promise.reject(err);
      }

      // Handle 401 unauthorized with token refresh
      if (err.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        console.log(`${role} received 401, attempting token refresh...`);
        
        try {
          const refreshRes = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}${refreshEndpointByRole[role]}`,
            {},
            { withCredentials: true }
          );

          const newToken = extractTokenFromRefreshResponse(role, refreshRes.data);
          
          if (!newToken) {
            console.log(`${role} refresh failed - no token in response`);
            throw new Error("Token refresh failed - no token returned");
          }

          console.log(`${role} token refreshed successfully`);
          roleTokenMap[role].set(newToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          return instance(originalRequest);
        } catch (refreshErr) {
          console.log(`${role} token refresh failed:`, refreshErr);
          roleTokenMap[role].set(null);
          
          // Only show error/redirect if on correct routes
          // Note: onCorrectRoutes check is already done above, so we're safe here
          console.log(`${role} refresh failed on ${role} routes - context will handle`);
          
          return Promise.reject(refreshErr);
        }
      }

      // For any other errors, just reject (no toasts here - let context handle)
      return Promise.reject(err);
    }
  );

  return instance;
};

export const api = getApi("user");
export const doctorApi = getApi("doctor");
export const adminApi = getApi("admin");