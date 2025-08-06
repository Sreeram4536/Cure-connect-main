const DOCTOR_ACCESS_TOKEN_KEY = 'doctorAccessToken';

export const getDoctorAccessToken = () => {
  const token = localStorage.getItem(DOCTOR_ACCESS_TOKEN_KEY);
  console.log("TokenManager: Getting doctor token:", token ? 'Present' : 'Not found');
  return token;
};

export const updateDoctorAccessToken = (token: string | null) => {
  console.log("TokenManager: Updating doctor token:", token ? 'Present' : 'null');
  if (token) {
    localStorage.setItem(DOCTOR_ACCESS_TOKEN_KEY, token);
    console.log("TokenManager: Token saved to localStorage");
  } else {
    localStorage.removeItem(DOCTOR_ACCESS_TOKEN_KEY);
    console.log("TokenManager: Token removed from localStorage");
  }
};

export const clearDoctorAccessToken = () => {
  console.log("TokenManager: Clearing doctor token");
  localStorage.removeItem(DOCTOR_ACCESS_TOKEN_KEY);
};
