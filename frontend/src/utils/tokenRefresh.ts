// Token refresh utility for Socket.IO connections
import { getUserAccessToken, updateUserAccessToken } from "../context/tokenManagerUser";
import { getDoctorAccessToken, updateDoctorAccessToken } from "../context/tokenManagerDoctor";
import { getAdminAccessToken, updateAdminAccessToken } from "../context/tokenManagerAdmin";
import { getActiveRole } from "../context/activeRole";

// Determine current user role based on which token exists and current URL
const getCurrentUserRole = (): "user" | "doctor" | "admin" | null => {
  const path = window.location.pathname.toLowerCase();
  const hasUserToken = !!getUserAccessToken();
  const hasDoctorToken = !!getDoctorAccessToken();
  const hasAdminToken = !!getAdminAccessToken();
  const activeRole = getActiveRole();

  const isAdminPath = path.startsWith("/admin");
  const isDoctorPath =
    path.startsWith("/doctor") ||
    path.startsWith("/doc-") ||
    path.includes("/doctor/dashboard") ||
    path.includes("/doctor-panel");
  const isUserPath =
    path.includes("/user") ||
    path.includes("/chat") ||
    path.includes("/chats") ||
    path.includes("/appointment") ||
    path.includes("/consultation");

  if (isAdminPath) {
    return "admin";
  }

  if (isUserPath) {
    return "user";
  }

  if (isDoctorPath) {
    return "doctor";
  }

  if (activeRole === "user" && hasUserToken) {
    return "user";
  }
  if (activeRole === "doctor" && hasDoctorToken) {
    return "doctor";
  }
  if (activeRole === "admin" && hasAdminToken) {
    return "admin";
  }

  if (hasUserToken) {
    return "user";
  }
  if (hasDoctorToken) {
    return "doctor";
  }
  if (hasAdminToken) {
    return "admin";
  }

  return null;
};

// Get role-specific token
export const getRoleSpecificToken = (): string | null => {
  const role = getCurrentUserRole();
  
  switch (role) {
    case 'user':
      return getUserAccessToken();
    case 'doctor':
      return getDoctorAccessToken();
    case 'admin':
      return getAdminAccessToken();
    default:
      return null;
  }
};

// Update role-specific token
const updateRoleSpecificToken = (token: string | null): void => {
  const role = getCurrentUserRole();
  
  switch (role) {
    case 'user':
      updateUserAccessToken(token);
      break;
    case 'doctor':
      updateDoctorAccessToken(token);
      break;
    case 'admin':
      updateAdminAccessToken(token);
      break;
  }
};

// Refresh token for specific role
export const refreshToken = async (): Promise<string | null> => {
  try {
    console.log('Attempting to refresh token...');
    const role = getCurrentUserRole();
    
    if (!role) {
      console.log('No user role detected');
      return null;
    }
    
    console.log(`Refreshing token for role: ${role}`);
    
    // Use role-specific refresh endpoint
    let endpoint: string;
    switch (role) {
      case 'user':
        endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/user/refresh-token`;
        break;
      case 'doctor':
        endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/doctor/refresh-token`;
        break;
      case 'admin':
        endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/admin/refresh-token`;
        break;
      default:
        console.log('Unknown role, cannot refresh token');
        return null;
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Refresh response:', data);
      // Handle role-specific token fields
      const refreshedToken = (() => {
        switch (role) {
          case 'doctor':
            return data.accessToken || data.token || null;
          case 'admin':
          case 'user':
          default:
            return data.token || null;
        }
      })();

      if (refreshedToken) {
        updateRoleSpecificToken(refreshedToken);
        console.log(`Token refreshed successfully for ${role}`);
        return refreshedToken;
      }
    }
    
    console.log('Token refresh failed:', response.status, response.statusText);
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

export const getValidToken = async (): Promise<string | null> => {
  const token = getRoleSpecificToken();
  
  if (!token) {
    console.log('No token found, attempting refresh');
    return await refreshToken();
  }

  try {
    // Check if token is expired by decoding it (without verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp && payload.exp < currentTime) {
      console.log('Token expired, attempting refresh');
      return await refreshToken();
    }
    
    return token;
  } catch (error) {
    console.error('Error checking token:', error);
    return await refreshToken();
  }
}; 