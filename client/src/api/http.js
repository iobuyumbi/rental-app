import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.method === "get") {
      config.params = { ...config.params, _t: Date.now() };
    }
    if (!navigator.onLine && config.method !== "get") {
      const error = new Error("Network request failed");
      error.isOffline = true;
      error.config = config;
      return Promise.reject(error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 1000;

    if (error.isOffline || !navigator.onLine) {
      throw new Error("You are offline. Please check your connection.");
    }

    if (
      error.code === "NETWORK_ERROR" ||
      error.code === "ECONNABORTED" ||
      (error.response && error.response.status >= 500)
    ) {
      if (
        !originalRequest._retry &&
        (originalRequest._retryCount || 0) < MAX_RETRIES
      ) {
        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
