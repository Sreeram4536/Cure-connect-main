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
      const { data } = await getDoctorProfileAPI();
      if (data.success) {
        setProfileData(data.profileData);
      }
    } catch (error) {
      showErrorToast(error);
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
          await getProfileData();
        } else {
          console.log("DoctorContext: No token from refresh, clearing");
          setDToken(null);
        }
      } catch (err: any) {
        console.warn(
          "Doctor token refresh failed",
          err.response?.data || err.message
        );
        console.log("DoctorContext: Refresh failed, clearing token");
        setDToken(null);
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
      getProfileData().finally(() => setLoading(false));
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
