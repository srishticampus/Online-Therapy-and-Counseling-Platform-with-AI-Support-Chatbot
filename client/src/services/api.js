import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor to add the Bearer token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Must match backend 'Bearer' check
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;