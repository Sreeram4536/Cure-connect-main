import { createContext, useEffect, useState, type ReactNode } from "react";
import type { Doctor } from "../assets/user/assets";
import { assets } from "../assets/user/assets";
import { toast } from "react-toastify";
import { getUserProfileAPI } from "../services/userProfileServices";
import { getDoctorsAPI, getDoctorsPaginatedAPI } from "../services/doctorServices";
import { showErrorToast } from "../utils/errorHandler";
import {
  getUserAccessToken,
  updateUserAccessToken,
  clearUserAccessToken,
} from "./tokenManagerUser";
import { refreshAccessTokenAPI } from "../services/authServices";

interface userData {
  name: string;
  email: string;
  image: string;
  address: {
    line1: string;
    line2: string;
  };
  gender: string;
  dob: string;
  phone: string;
}

interface PaginationData {
  data: any[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface AppContextType {
  doctors: Doctor[];
  getDoctorsData: () => Promise<void>;
  getDoctorsPaginated: (page: number, limit: number, speciality?: string, searchQuery?: string, sortBy?: string, sortOrder?: 'asc' | 'desc') => Promise<PaginationData>;
  currencySymbol: string;
  backendUrl: string;
  token: string | null;
  setToken: (token: string | null) => void;
  userData: userData | null;
  setUserData: React.Dispatch<React.SetStateAction<userData | null>>;
  loadUserProfileData: () => Promise<void>;
  calculateAge: (dob: string) => number;
  slotDateFormat: (slotDate: string) => string;
  authLoading: boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppContextProviderProps {
  children: ReactNode;
}

const AppContextProvider: React.FC<AppContextProviderProps> = ({
  children,
}) => {
  const currencySymbol = "₹";
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [doctors, setDoctors] = useState([]);
  const [token, setTokenState] = useState<string | null>(getUserAccessToken());
  const [userData, setUserData] = useState<null | userData>({
    name: "",
    email: "",
    phone: "",
    image: `${assets.upload_image}`,
    address: {
      line1: "",
      line2: "",
    },
    gender: "",
    dob: "",
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const getDoctorsData = async () => {
    try {
      const { data } = await getDoctorsAPI();
      if (data.success) {
        setDoctors(data.data || data.doctors || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      showErrorToast(error);
    }
  };

  const getDoctorsPaginated = async (page: number, limit: number, speciality?: string, searchQuery?: string, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<PaginationData> => {
    try {
      const { data } = await getDoctorsPaginatedAPI(page, limit, speciality, searchQuery, sortBy, sortOrder);
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

  const loadUserProfileData = async () => {
    try {
      const path = window.location.pathname;
      const isOnUserRoutes = !path.startsWith("/admin") && !path.startsWith("/doctor");

      const accessToken = getUserAccessToken();
      if (!accessToken) {
        // Only show login error on user routes
        if (isOnUserRoutes) {
          toast.error("Please login to continue...");
        }
        return;
      }

      const { data } = await getUserProfileAPI(accessToken);
      if (data.success) {
        // Always set user data (needed for cross-role usage)
        setUserData(data.userData);
        
        // Only check blocked status and logout if on user routes
        if (data.userData.isBlocked && isOnUserRoutes) {
          toast.error("Your account has been blocked by admin.");
          clearToken();
          setIsLoggedOut(true);
          localStorage.setItem("isUserLoggedOut", "true");
          return;
        }
      } else {
        // Only show error if on user routes
        if (isOnUserRoutes) {
          toast.error(data.message);
        }
      }
    } catch (error) {
      const path = window.location.pathname;
      // Only show error if on user routes
      if (!path.startsWith("/admin") && !path.startsWith("/doctor")) {
        showErrorToast(error);
      }
      // Note: We don't throw here to allow other functionality to continue
    }
  };

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      updateUserAccessToken(newToken);
      setAuthLoading(false);
    } else {
      clearUserAccessToken();
      setAuthLoading(false);
      setIsLoggedOut(true);
    }
  };

  const clearToken = () => {
    setTokenState(null);
    clearUserAccessToken();
    setUserData({
      name: "",
      email: "",
      phone: "",
      image: `${assets.upload_image}`,
      address: {
        line1: "",
        line2: "",
      },
      gender: "",
      dob: "",
    });
  };

  const calculateAge = (dob: string): number => {
    const today = new Date();
    const birthDate = new Date(dob);
    return today.getFullYear() - birthDate.getFullYear();
  };

  const slotDateFormat = (slotDate: string): string => {
    if (!slotDate) return "N/A";
    let day, monthIndex, year;
    if (slotDate.includes("_")) {
      const dateArray = slotDate.split("_");
      if (dateArray.length < 3) return "N/A";
      day = dateArray[0];
      monthIndex = Number(dateArray[1]);
      year = dateArray[2];
    } else if (slotDate.includes("-")) {
      const dateArray = slotDate.split("-");
      if (dateArray.length < 3) return "N/A";
      year = dateArray[0];
      monthIndex = Number(dateArray[1]);
      day = dateArray[2];
    } else {
      return "N/A";
    }
    const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (isNaN(monthIndex) || !months[monthIndex]) return "N/A";
    return `${day} ${months[monthIndex]} ${year}`;
  };

  useEffect(() => {
    const path = window.location.pathname;

    // ✅ CRITICAL FIX: Skip token refresh on public/auth pages
    const publicPaths = ["/login", "/register", "/"];
    const isPublicPath = publicPaths.some(p => path === p || path.startsWith(p + "/"));
    
    // ✅ Also skip on admin and doctor routes
    if (isPublicPath || path.startsWith("/admin") || path.startsWith("/doctor")) {
      console.log("AppContext: On public/other role routes, skipping user token refresh");
      setAuthLoading(false);
      return;
    }

    // ✅ Skip if user was logged out
    if (isLoggedOut) {
      console.log("AppContext: User logged out, skipping refresh");
      setAuthLoading(false);
      return;
    }

    const handleBlockedOrLogout = () => {
      if (getUserAccessToken()) {
        clearToken();
        setIsLoggedOut(true);
        localStorage.setItem("isUserLoggedOut", "true");
        toast.error("Your account has been blocked by admin.");
      }
    };

    const tryRefresh = async () => {
      try {
        console.log("AppContext: Attempting token refresh");
        const res = await refreshAccessTokenAPI();
        const newToken = res.data?.token;

        if (newToken) {
          setToken(newToken);
          const profileRes = await getUserProfileAPI(newToken);
          const currentPath = window.location.pathname;
          const isOnUserRoutes = !currentPath.startsWith("/admin") && !currentPath.startsWith("/doctor");
          
          // Always set user data (needed for cross-role usage)
          if (profileRes.data?.success) {
            setUserData(profileRes.data.userData);
            
            // Only check blocked status and logout if on user routes
            if (profileRes.data.userData?.isBlocked && isOnUserRoutes) {
              handleBlockedOrLogout();
              return;
            }
          } else {
            // Only handle logout if on user routes
            if (isOnUserRoutes) {
              handleBlockedOrLogout();
            }
          }
        } else {
          console.log("AppContext: No token from refresh");
          const currentPath = window.location.pathname;
          // Only handle logout if on user routes
          if (!currentPath.startsWith("/admin") && !currentPath.startsWith("/doctor")) {
            handleBlockedOrLogout();
          }
        }
      } catch (err: any) {
        console.warn(
          "User token refresh failed",
          err.response?.data || err.message
        );
        handleBlockedOrLogout();
      } finally {
        setAuthLoading(false);
      }
    };

    const wasLoggedOut = localStorage.getItem("isUserLoggedOut") === "true";
    const currentToken = getUserAccessToken();

    if (!currentToken) {
      if (!wasLoggedOut) {
        console.log("AppContext: No token and not logged out, trying refresh");
        tryRefresh();
      } else {
        console.log("AppContext: No token and was logged out, not refreshing");
        setAuthLoading(false);
      }
    } else {
      console.log("AppContext: Token exists, loading profile");
      getUserProfileAPI(currentToken)
        .then(profileRes => {
          const currentPath = window.location.pathname;
          const isOnUserRoutes = !currentPath.startsWith("/admin") && !currentPath.startsWith("/doctor");
          
          // Always set user data (needed for cross-role usage)
          if (profileRes.data?.success) {
            setUserData(profileRes.data.userData);
            
            // Only check blocked status and logout if on user routes
            if (profileRes.data.userData?.isBlocked && isOnUserRoutes) {
              handleBlockedOrLogout();
            }
          } else {
            // Only handle logout if on user routes
            if (isOnUserRoutes) {
              handleBlockedOrLogout();
            }
          }
        })
        .catch(err => {
          const currentPath = window.location.pathname;
          // Only show error and logout if on user routes
          if (!currentPath.startsWith("/admin") && !currentPath.startsWith("/doctor")) {
            showErrorToast(err);
            handleBlockedOrLogout();
          }
          // Note: We don't throw here to allow other functionality to continue
        })
        .finally(() => setAuthLoading(false));
    }
  }, []);

  useEffect(() => {
    if (token) {
      // Only load profile if we're not on public/other role routes
      const path = window.location.pathname;
      const publicPaths = ["/login", "/register", "/"];
      const isPublicPath = publicPaths.some(p => path === p || path.startsWith(p + "/"));
      
      if (!isPublicPath && !path.startsWith("/admin") && !path.startsWith("/doctor")) {
        loadUserProfileData();
      }
    } else {
      setUserData({
        name: "",
        email: "",
        phone: "",
        image: `${assets.upload_image}`,
        address: {
          line1: "",
          line2: "",
        },
        gender: "",
        dob: "",
      });
    }
  }, [token]);

  const value: AppContextType = {
    doctors,
    getDoctorsData,
    getDoctorsPaginated,
    currencySymbol,
    backendUrl,
    token,
    setToken,
    userData,
    setUserData,
    loadUserProfileData,
    calculateAge,
    slotDateFormat,
    authLoading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;