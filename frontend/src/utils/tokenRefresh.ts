import { getDoctorAccessToken, updateDoctorAccessToken } from "../context/tokenManagerDoctor";
import { getUserAccessToken, updateUserAccessToken } from "../context/tokenManagerUser";
import { getAdminAccessToken, updateAdminAccessToken } from "../context/tokenManagerAdmin";

// Determine which role token we currently have
const getCurrentRoleAndToken = (): { role: "doctor" | "user" | "admin"; token: string } | null => {
  const d = getDoctorAccessToken();
  if (d) return { role: "doctor", token: d };
  const u = getUserAccessToken();
  if (u) return { role: "user", token: u };
  const a = getAdminAccessToken?.();
  if (a) return { role: "admin", token: a };
  return null;
};

const decodeJwt = (token: string): any | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
};

const isExpired = (token: string): boolean => {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return false;
  const now = Date.now() / 1000;
  return payload.exp < now;
};

// Role-aware refresh. Tries a specific role if provided; otherwise attempts doctor -> user -> admin
export const refreshToken = async (preferredRole?: "doctor" | "user" | "admin"): Promise<string | null> => {
  try {
    const endpoints: Array<{
      role: "doctor" | "user" | "admin";
      url: string;
      onToken: (t: string | null) => void;
      // key in response that contains the access token
      tokenKey: "accessToken" | "token";
    }> = [
      { role: "doctor", url: `${import.meta.env.VITE_BACKEND_URL}/api/doctor/refresh-token`, onToken: updateDoctorAccessToken, tokenKey: "accessToken" },
      { role: "user", url: `${import.meta.env.VITE_BACKEND_URL}/api/user/refresh-token`, onToken: updateUserAccessToken, tokenKey: "token" },
      { role: "admin", url: `${import.meta.env.VITE_BACKEND_URL}/api/admin/refresh-token`, onToken: updateAdminAccessToken, tokenKey: "token" },
    ];

    const ordered = preferredRole
      ? [endpoints.find(e => e.role === preferredRole)!, ...endpoints.filter(e => e.role !== preferredRole)]
      : endpoints;

    for (const ep of ordered) {
      try {
        const res = await fetch(ep.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) continue;
        const data = await res.json();
        const newToken = data?.[ep.tokenKey];
        if (data?.success && typeof newToken === "string" && newToken.length > 0) {
          ep.onToken(newToken);
          return newToken;
        }
      } catch {
        // try next
      }
    }

    return null;
  } catch (error) {
    console.error("Error refreshing token (socket)", error);
    return null;
  }
};

export const getValidToken = async (): Promise<string | null> => {
  // Prefer doctor, then user, then admin
  const current = getCurrentRoleAndToken();
  if (current && !isExpired(current.token)) return current.token;

  // If we know which role we have but token is expired, try that role first
  if (current && isExpired(current.token)) {
    const refreshed = await refreshToken(current.role);
    if (refreshed) return refreshed;
  }

  // If no token present or refresh failed, attempt any role in order doctor -> user -> admin
  return await refreshToken();
}; 