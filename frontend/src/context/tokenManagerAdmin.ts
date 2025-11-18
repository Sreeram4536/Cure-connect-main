import { clearActiveRole, setActiveRole } from "./activeRole";

const ADMIN_ACCESS_TOKEN_KEY = "adminAccessToken";

export const getAdminAccessToken = () => {
  return localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
};

export const updateAdminAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, token);
    setActiveRole("admin");
  } else {
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    clearActiveRole("admin");
  }
};

export const clearAdminAccessToken = () => {
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  clearActiveRole("admin");
};
