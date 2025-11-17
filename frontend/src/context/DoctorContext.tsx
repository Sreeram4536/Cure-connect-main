import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "react-toastify";
import { showErrorToast } from "../utils/errorHandler";
import {
  AppointmentCancelAPI,
  AppointmentConfirmAPI,
  getDoctorAppointmentsAPI,
  getDoctorAppointmentsPaginatedAPI,
  getDoctorProfileAPI,
  refreshDoctorAccessTokenAPI,
  doctorDashboardAPI,
} from "../services/doctorServices";
import type { AppointmentTypes } from "../types/appointment";
import type { DoctorProfileType } from "../types/doctor";
import {
  getDoctorAccessToken,
  updateDoctorAccessToken,
  clearDoctorAccessToken,
} from "./tokenManagerDoctor";

interface PaginationData {
  data: any[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface DoctorContextType {
  dToken: string;
  setDToken: (token: string | null) => void;
  backendUrl: string;
  appointments: AppointmentTypes[];
  setAppointments: React.Dispatch<React.SetStateAction<AppointmentTypes[]>>;
  getAppointments: () => Promise<void>;
  getAppointmentsPaginated: (page: number, limit: number, searchQuery?: string, sortOrder?: 'asc' | 'desc') => Promise<PaginationData>;
  confirmAppointment: (appointmentId: string) => Promise<void>;
  cancelAppointment: (appointmentId: string, page?: number, limit?: number) => Promise<any>;
  profileData: DoctorProfileType | null;
  setProfileData: React.Dispatch<
    React.SetStateAction<DoctorProfileType | null>
  >;
  getProfileData: () => Promise<void>;
  dashData: any;
  getDashData: () => Promise<void>;
  loading: boolean;
}

export const DoctorContext = createContext<DoctorContextType>(
  {} as DoctorContextType
);

interface DoctorContextProviderProps {
  children: ReactNode;
}

const DoctorContextProvider = ({ children }: DoctorContextProviderProps) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const initialToken = getDoctorAccessToken() ?? "";
  console.log("DoctorContext: Initial token value:", initialToken);
  
  const [dToken, setDTokenState] = useState(initialToken);
  const [appointments, setAppointments] = useState<AppointmentTypes[]>([]);
  const [profileData, setProfileData] = useState<DoctorProfileType | null>(
    null
  );
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const setDToken = (newToken: string | null) => {
    console.log("DoctorContext: setDToken called with:", newToken);
    setDTokenState(newToken ?? "");
    console.log("DoctorContext: Token state updated");
    if (newToken) {
      updateDoctorAccessToken(newToken);
      console.log("DoctorContext: Token saved to localStorage");
      // Set loading to false when token is set
      setLoading(false);
    } else {
      clearDoctorAccessToken();
      setAppointments([]);
      setProfileData(null);
      console.log("DoctorContext: Token cleared from localStorage");
      // Set loading to false when token is cleared
      setLoading(false);
      setIsLoggedOut(true); 
    }
  };

  const getAppointments = async () => {
    try {
      const { data } = await getDoctorAppointmentsAPI();
      if (data.success && Array.isArray(data.appointments)) {
        setAppointments([...data.appointments].reverse());
      } else {
        setAppointments([]);
        toast.error(data.message || "No appointments found");
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

 
  const getAppointmentsPaginated = async (page: number, limit: number, searchQuery?: string, sortOrder: 'asc' | 'desc' = 'desc'): Promise<PaginationData> => {
    try {
      const { data } = await getDoctorAppointmentsPaginatedAPI(page, limit, searchQuery, 'createdAt', sortOrder);
      if (data.success && Array.isArray(data.data)) {
        return {
          data: data.data,
          totalCount: data.totalCount,
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          hasNextPage: data.hasNextPage,
          hasPrevPage: data.hasPrevPage
        };
      } else {
        toast.error(data.message || "No appointments found");
        return {
          data: [],
          totalCount: 0,
          currentPage: page,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        };
      }
    } catch (error) {
      showErrorToast(error);
      return {
        data: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      };
    }
  };

  const confirmAppointment = async (appointmentId: string) => {
    try {
      const { data } = await AppointmentConfirmAPI(appointmentId);
      if (data.success) {
        toast.success(data.message);
        getAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const cancelAppointment = async (appointmentId: string, page?: number, limit?: number) => {
    try {
      const { data } = await AppointmentCancelAPI(appointmentId, page, limit);
      if (data.success) {
        toast.success(data.message);
        return data; // Return the API response
      } else {
        toast.error(data.message);
        return null;
      }
    } catch (error) {
      showErrorToast(error);
      return null;
    }
  };

  const getProfileData = async () => {
    try {
      const path = window.location.pathname;
      const isOnDoctorRoutes = path.startsWith("/doctor");

      const { data } = await getDoctorProfileAPI();
      if (data.success) {
        // Always set profile data (needed for cross-role usage)
        setProfileData(data.profileData);
        
        // ❗️BLOCKED DOCTOR LOGOUT - Only logout on doctor routes
        // Note: Toast is handled by axios interceptor, don't show duplicate
        if (data.profileData.isBlocked && isOnDoctorRoutes) {
          setDToken(null);
          return;
        }
      }
    } catch (error) {
      // Only show error toast if on doctor routes and it's not a blocked error
      // (blocked errors are handled by axios interceptor)
      const path = window.location.pathname;
      if (path.startsWith("/doctor")) {
        const axiosError = error as any;
        // Don't show toast if it's a blocked error (403 with blocked: true)
        // The axios interceptor will handle it
        if (!(axiosError.response?.status === 403 && axiosError.response?.data?.blocked)) {
          showErrorToast(error);
        }
      }
      // Note: We don't throw here to allow other functionality to continue
    }
  };

  const getDashData = async () => {
    try {
      console.log("DoctorContext: Getting dashboard data...");
      const { data } = await doctorDashboardAPI();
      console.log("DoctorContext: Dashboard API response:", data);
      if (data.success) {
        console.log("DoctorContext: Setting dashboard data:", data.dashData);
        setDashData(data.dashData);
      } else {
        console.error("DoctorContext: Dashboard API error:", data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error("DoctorContext: Dashboard API error:", error);
      showErrorToast(error);
    }
  };

  useEffect(() => {
     const path = window.location.pathname;

  // ✅ Skip token checks on login/register pages and forgot password pages
  const publicPaths = ["/doctor/login", "/doctor/register", "/doctor/verify-email", "/doctor/verify-otp", "/doctor/reset-password"];
  if (publicPaths.includes(path)) {
    setLoading(false);
    return;
  }
    if (isLoggedOut) {
    console.log("DoctorContext: User logged out, skipping refresh");
    setLoading(false);
    return;
  }
   const handleBlockedOrLogout = () => {
     if (getDoctorAccessToken()) { // prevent double execution
      setDToken(null);
      setIsLoggedOut(true);
      localStorage.setItem("isDoctorLoggedOut", "true");
      // toast.error("Your account has been blocked by admin.");
      // window.location.replace("/doctor/login");
    }
  };
    console.log("DoctorContext: useEffect running");
    const tryRefresh = async () => {
      try {
        console.log("DoctorContext: Attempting token refresh");
        const res = await refreshDoctorAccessTokenAPI();
        const newToken = res.data?.accessToken;
        console.log("DoctorContext: Refresh response:", newToken ? 'Token received' : 'No token');
        if (newToken) {
          console.log("DoctorContext: Setting token from refresh");
          setDToken(newToken);
          const profileRes = await getDoctorProfileAPI();
          const currentPath = window.location.pathname;
          const isOnDoctorRoutes = currentPath.startsWith("/doctor");
          
          // Always set profile data (needed for cross-role usage)
          if (profileRes.data?.success) {
            setProfileData(profileRes.data.profileData);
            
            // Only check blocked status and logout if on doctor routes
            // Note: Toast is handled by axios interceptor if API returns 403, don't show duplicate
            if (profileRes.data.profileData?.isBlocked && isOnDoctorRoutes) {
              // Just logout, don't show toast (axios interceptor handles it)
              handleBlockedOrLogout();
              return;
            }
          } else {
            // Only handle logout if on doctor routes
            if (isOnDoctorRoutes) {
              handleBlockedOrLogout();
            }
          }
          // await getProfileData();
        } else {
          console.log("DoctorContext: No token from refresh, clearing");
          // setDToken(null);
          handleBlockedOrLogout();
        }
      } catch (err: any) {
        console.warn(
          "Doctor token refresh failed",
          err.response?.data || err.message
        );
        console.log("DoctorContext: Refresh failed, clearing token");
        // setDToken(null);
        handleBlockedOrLogout();
      } finally {
        setLoading(false);
      }
    };

    const wasLoggedOut = localStorage.getItem("isDoctorLoggedOut") === "true";
    const currentToken = getDoctorAccessToken();
    console.log("DoctorContext: Current token from localStorage:", currentToken ? 'Present' : 'Not found');
    console.log("DoctorContext: Was logged out:", wasLoggedOut);

    if (!currentToken) {
      if (!wasLoggedOut) {
        console.log("DoctorContext: No token and not logged out, trying refresh");
        tryRefresh();
      } else {
        console.log("DoctorContext: No token and was logged out, not refreshing");
        setLoading(false);
      }
    } else {
      console.log("DoctorContext: Token exists, getting profile data");
      // getProfileData().finally(() => setLoading(false));
      getDoctorProfileAPI()
      .then(profileRes => {
        const currentPath = window.location.pathname;
        const isOnDoctorRoutes = currentPath.startsWith("/doctor");
        
        // Always set profile data (needed for cross-role usage)
        if (profileRes.data?.success) {
          setProfileData(profileRes.data.profileData);
          
          // Only check blocked status and logout if on doctor routes
          // Note: Toast is handled by axios interceptor if API returns 403, don't show duplicate
          if (profileRes.data.profileData?.isBlocked && isOnDoctorRoutes) {
            // Just logout, don't show toast (axios interceptor handles it)
            handleBlockedOrLogout();
          }
        } else {
          // Only handle logout if on doctor routes
          if (isOnDoctorRoutes) {
            handleBlockedOrLogout();
          }
        }
      })
      .catch(err => {
        const currentPath = window.location.pathname;
        // Only show error and logout if on doctor routes
        if (currentPath.startsWith("/doctor")) {
          const axiosError = err as any;
          // Don't show toast if it's a blocked error (403 with blocked: true)
          // The axios interceptor will handle it
          if (!(axiosError.response?.status === 403 && axiosError.response?.data?.blocked)) {
            showErrorToast(err);
          }
          handleBlockedOrLogout();
        }
        // Note: We don't throw here to allow other functionality to continue
      })
      .finally(() => setLoading(false));
    }
  }, []);

  const value: DoctorContextType = {
    dToken,
    setDToken: setDToken,
    backendUrl,
    appointments,
    setAppointments,
    getAppointments,
    getAppointmentsPaginated,
    confirmAppointment,
    cancelAppointment,
    profileData,
    setProfileData,
    getProfileData,
    dashData,
    getDashData,
    loading,
  };

  return (
    <DoctorContext.Provider value={value}>{children}</DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
