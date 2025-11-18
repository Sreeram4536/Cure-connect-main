import { clearActiveRole, setActiveRole } from "./activeRole";

const USER_ACCESS_TOKEN_KEY = "userAccessToken";

export const getUserAccessToken = () => {
  return localStorage.getItem(USER_ACCESS_TOKEN_KEY);
};

export const updateUserAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(USER_ACCESS_TOKEN_KEY, token);
    setActiveRole("user");
  } else {
    localStorage.removeItem(USER_ACCESS_TOKEN_KEY);
    clearActiveRole("user");
  }
};

export const clearUserAccessToken = () => {
  localStorage.removeItem(USER_ACCESS_TOKEN_KEY);
  clearActiveRole("user");
};
