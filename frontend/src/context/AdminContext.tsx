

import { createContext, useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import type { Doctor } from "../assets/user/assets";
import type { userData } from "../types/user";
import {
  adminCancelAppointmentAPI,
  adminDashboardAPI,
  approveDoctorAPI,
  changeAvailabilityAPI,
  getAllAppointmentsAPI,
  getAppointmentsPaginatedAPI,
  getAllDoctorsAPI,
  getDoctorsPaginatedAPI,
  getAllUsersAPI,
  getUsersPaginatedAPI,
  refreshAdminAccessTokenAPI,
  rejectDoctorAPI,
  toggleUserBlockAPI,
  toggleDoctorBlockAPI,
} from "../services/adminServices";
import { showErrorToast } from "../utils/errorHandler";
import type { AppointmentTypes } from "../types/appointment";
import { 
  clearAdminAccessToken, 
  getAdminAccessToken, 
  updateAdminAccessToken 
} from "./tokenManagerAdmin";

interface PaginationData<T = unknown> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface DashData {
  totalUsers: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
  // Add other dashboard properties as needed
}

interface AdminContextType {
  aToken: string;
  setAToken: (token: string) => void;
  backendUrl: string;
  doctors: Doctor[];
  getAllDoctors: () => Promise<void>;
  getDoctorsPaginated: (page: number, limit: number, searchQuery?: string) => Promise<PaginationData<Doctor>>;
  changeAvailability: (docId: string) => Promise<void>;
  users: userData[];
  getAllUsers: () => Promise<void>;
  getUsersPaginated: (page: number, limit: number, searchQuery: string) => Promise<PaginationData<userData>>;
  toggleBlockUser: (userId: string, block: boolean) => Promise<void>;
  toggleBlockDoctor: (doctorId: string, block: boolean) => Promise<void>;
  appointments: AppointmentTypes[];
  setAppointments: React.Dispatch<React.SetStateAction<AppointmentTypes[]>>;
  getAllAppointments: () => Promise<void>;
  getAppointmentsPaginated: (page: number, limit: number, searchQuery?: string) => Promise<PaginationData<AppointmentTypes>>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  dashData: DashData | false;
  getDashData: () => Promise<void>;
  approveDoctor: (doctorId: string) => Promise<void>;
  rejectDoctor: (doctorId: string) => Promise<void>;
  loading: boolean;
}

export const AdminContext = createContext<AdminContextType | null>(null);

interface AdminContextProviderProps {
  children: ReactNode;
}

const AdminContextProvider = ({ children }: AdminContextProviderProps) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [aToken, setAToken] = useState(getAdminAccessToken() ?? "");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [users, setUsers] = useState<userData[]>([]);
  const [appointments, setAppointments] = useState<AppointmentTypes[]>([]);
  const [dashData, setDashData] = useState<DashData | false>(false);
  const [loading, setLoading] = useState(true);
  
  const isRefreshing = useRef(false);
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const setToken = (newToken: string | null) => {
    setAToken(newToken ?? "");
    if (newToken) {
      updateAdminAccessToken(newToken);
    } else {
      clearAdminAccessToken();
    }
  };

  const getAllDoctors = async (): Promise<void> => {
    try {
      const { data } = await getAllDoctorsAPI();
      if (data.success) {
        setDoctors(data.doctors);
        console.log(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const getDoctorsPaginated = async (page: number, limit: number, searchQuery: string = ""): Promise<PaginationData<Doctor>> => {
    try {
      const { data } = await getDoctorsPaginatedAPI(page, limit, searchQuery);
      if (data.success) {
        return {
          data: data.data,
          totalCount: data.totalCount,
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          hasNextPage: data.hasNextPage,
          hasPrevPage: data.hasPrevPage
        };
      } else {
        toast.error(data.message);
        throw new Error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
      throw error;
    }
  };

  const approveDoctor = async (doctorId: string): Promise<void> => {
    try {
      const { data } = await approveDoctorAPI(doctorId);
      if (data.success) {
        toast.success(data.message);
        
        setDoctors(prevDoctors => 
          prevDoctors.map(doctor => 
            doctor._id === doctorId 
              ? { ...doctor, isApproved: true }
              : doctor
          )
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const rejectDoctor = async (doctorId: string): Promise<void> => {
    try {
      const { data } = await rejectDoctorAPI(doctorId);
      if (data.success) {
        toast.success(data.message);
        
        setDoctors(prevDoctors => 
          prevDoctors.filter(doctor => doctor._id !== doctorId)
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const changeAvailability = async (docId: string): Promise<void> => {
    try {
      const doctor = doctors.find((doc) => doc._id === docId);
      if (!doctor) {
        toast.error("Doctor not found");
        return;
      }

      const newAvailability = !doctor.available;

      const { data } = await changeAvailabilityAPI(
        docId,
        newAvailability,
        
      );
      if (data.success) {
        toast.success(data.message);
        
        setDoctors(prevDoctors => 
          prevDoctors.map(doc => 
            doc._id === docId 
              ? { ...doc, available: newAvailability }
              : doc
          )
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const getAllUsers = async (): Promise<void> => {
    try {
      const { data } = await getAllUsersAPI();
      if (data.success) {
        setUsers(data.users);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const getUsersPaginated = async (page: number, limit: number, searchQuery: string): Promise<PaginationData<userData>> => {
    try {
      const { data } = await getUsersPaginatedAPI(page, limit, searchQuery);
      if (data.success) {
        return {
          data: data.data,
          totalCount: data.totalCount,
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          hasNextPage: data.hasNextPage,
          hasPrevPage: data.hasPrevPage
        };
      } else {
        toast.error(data.message);
        throw new Error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
      throw error;
    }
  };

  const toggleBlockUser = async (userId: string, block: boolean): Promise<void> => {
    try {
      const { data } = await toggleUserBlockAPI(userId, block);
      if (data.success) {
        toast.success(data.message);
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { ...user, isBlocked: block }
              : user
          )
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const toggleBlockDoctor = async (doctorId: string, block: boolean): Promise<void> => {
    try {
      const { data } = await toggleDoctorBlockAPI(doctorId, block);
      if (data.success) {
        toast.success(data.message);
        
        setDoctors(prevDoctors => 
          prevDoctors.map(doctor => 
            doctor._id === doctorId 
              ? { ...doctor, isBlocked: block }
              : doctor
          )
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const getAllAppointments = async (): Promise<void> => {
    try {
      const { data } = await getAllAppointmentsAPI();

      if (data.success) {
        setAppointments(data.appointments.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const getAppointmentsPaginated = async (page: number, limit: number, searchQuery: string = ""): Promise<PaginationData<AppointmentTypes>> => {
    try {
      const { data } = await getAppointmentsPaginatedAPI(page, limit, searchQuery);
      if (data.success) {
        return {
          data: data.data,
          totalCount: data.totalCount,
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          hasNextPage: data.hasNextPage,
          hasPrevPage: data.hasPrevPage
        };
      } else {
        toast.error(data.message);
        throw new Error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
      throw error;
    }
  };

  const cancelAppointment = async (appointmentId: string): Promise<void> => {
    try {
      const { data } = await adminCancelAppointmentAPI(appointmentId);

      if (data.success) {
        toast.success(data.message);
        getAllAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const getDashData = async (): Promise<void> => {
    try {
      const { data } = await adminDashboardAPI();

      if (data.success) {
        setDashData(data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  useEffect(() => {
    if (!isAdminRoute) {
      setLoading(false);
      return;
    }

    if (isRefreshing.current) {
      return;
    }

    const tryRefresh = async () => {
      if (isRefreshing.current) return;
      
      isRefreshing.current = true;
      try {
        const res = await refreshAdminAccessTokenAPI();
        const newToken = res.data?.token;
        if (newToken) {
          setToken(newToken);
          await getDashData();
        } else {
          setToken(null);
        }
      } catch (err: unknown) {
        console.warn(
          "Admin token refresh failed",
          (err as { response?: { data?: unknown }; message?: string }).response?.data || 
          (err as { message?: string }).message
        );
        setToken(null);
      } finally {
        setLoading(false);
        isRefreshing.current = false;
      }
    };

    const wasLoggedOut = localStorage.getItem("isAdminLoggedOut") === "true";

    if (!getAdminAccessToken()) {
      if (!wasLoggedOut) {
        tryRefresh();
      } else {
        setLoading(false);
      }
    } else {
      getDashData().finally(() => setLoading(false));
    }
  }, [isAdminRoute]); 

  const value: AdminContextType = {
    aToken,
    setAToken,
    backendUrl,
    doctors,
    getAllDoctors,
    getDoctorsPaginated,
    changeAvailability,
    users,
    getAllUsers,
    getUsersPaginated,
    toggleBlockUser,
    toggleBlockDoctor,
    appointments,
    setAppointments,
    getAllAppointments,
    getAppointmentsPaginated,
    cancelAppointment,
    dashData,
    getDashData,
    approveDoctor,
    rejectDoctor,
    loading,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

export default AdminContextProvider;