import axios from "axios";
import {
  getAdminAccessToken,
  updateAdminAccessToken,
} from "../context/tokenManagerAdmin";

export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

adminApi.interceptors.request.use(
  (config) => {
    const token = getAdminAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (res) => {
    // Check for new access token in response header
    const newToken = res.headers['new-access-token'];
    if (newToken) {
      console.log('New access token received from server');
      updateAdminAccessToken(newToken);
    }
    return res;
  },
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('Admin axios: 401 error, attempting token refresh...');

      try {
        console.log('Admin axios: Making refresh token request...');
        const refreshRes = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/refresh-token`,
          {},
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Admin axios: Refresh response status:', refreshRes.status);
        console.log('Admin axios: Refresh response data:', refreshRes.data);

        if (refreshRes.data.success && refreshRes.data.token) {
          const newToken = refreshRes.data.token;
          console.log('Admin axios: Updating token with new token');
          updateAdminAccessToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return adminApi(originalRequest);
        } else {
          console.log('Admin axios: Refresh failed - no token in response');
          return Promise.reject(new Error('Token refresh failed'));
        }
      } catch (refreshErr: any) {
        console.log('Admin axios: Refresh error:', refreshErr.message);
        console.log('Admin axios: Refresh error response:', refreshErr.response?.data);
        
        // If refresh fails, clear the token and redirect to login
        updateAdminAccessToken(null);
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);
