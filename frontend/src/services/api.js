import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9090/api",
});

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Get the auth context and trigger session expired
      const event = new CustomEvent("sessionExpired", {
        detail: error.response?.data,
      });
      window.dispatchEvent(event);
    }
    return Promise.reject(error);
  }
);

export const withAuth = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export default api;
