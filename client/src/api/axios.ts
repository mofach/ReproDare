import axios from 'axios';

// Mengambil URL dari .env, fallback ke localhost jika tidak ada
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jika token expired (401), hapus data localstorage agar user login ulang
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user-storage');
      // Opsional: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);