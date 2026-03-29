import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions if used
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle standard API errors (e.g., 401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token using a clean axios instance to avoid interceptor loops
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });

        // If successful, retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, do not loop
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
