const ACTIVE_ROLE_KEY = "activeRole";

export type ActiveRole = "user" | "doctor" | "admin";

export const setActiveRole = (role: ActiveRole) => {
  localStorage.setItem(ACTIVE_ROLE_KEY, role);
};

export const clearActiveRole = (role?: ActiveRole) => {
  if (!role) {
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    return;
  }

  const current = localStorage.getItem(ACTIVE_ROLE_KEY);
  if (current === role) {
    localStorage.removeItem(ACTIVE_ROLE_KEY);
  }
};

export const getActiveRole = (): ActiveRole | null => {
  const stored = localStorage.getItem(ACTIVE_ROLE_KEY);
  if (stored === "user" || stored === "doctor" || stored === "admin") {
    return stored;
  }
  return null;
};

