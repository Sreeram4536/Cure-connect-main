const ADMIN_ACCESS_TOKEN_KEY = 'adminAccessToken';

export const getAdminAccessToken = () => {
  const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
  console.log("TokenManagerAdmin: Getting admin token:", token ? "Present" : "Not present");
  return token;
};

export const updateAdminAccessToken = (token: string | null) => {
  console.log("TokenManagerAdmin: Updating admin token:", token ? "Set" : "Cleared");
  if (token) {
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  }
};

export const clearAdminAccessToken = () => {
  console.log("TokenManagerAdmin: Clearing admin token");
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
};
