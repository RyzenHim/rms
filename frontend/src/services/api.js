import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export const withAuth = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export default api;
