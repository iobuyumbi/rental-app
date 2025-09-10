import axios from 'axios';
import { toast } from 'sonner';

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  },
});

// Request interceptor to add auth token and handle offline mode
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp to prevent caching for GET requests
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime(),
      };
    }
    
    // If offline and not a GET request, we'll handle it differently
    if (!navigator.onLine && config.method !== 'get') {
      // This will be caught by the response interceptor
      const error = new Error('Network request failed');
      error.isOffline = true;
      error.config = config;
      return Promise.reject(error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic and offline handling
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses for offline use
    if (response.config.method === 'get' && response.data) {
      const cacheKey = `api-cache:${response.config.url}`;
      const cacheData = {
        data: response.data,
        timestamp: Date.now(),
        headers: response.headers
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle offline scenario
    if (error.isOffline || !navigator.onLine) {
      // For GET requests, try to return cached data if available
      if (originalRequest.method === 'get' && originalRequest.url) {
        const cacheKey = `api-cache:${originalRequest.url}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const { data, timestamp, headers } = JSON.parse(cachedData);
            // Check if cache is still valid (1 hour by default)
            const maxAge = parseInt(originalRequest.headers['x-cache-max-age'] || '3600000', 10);
            if (Date.now() - timestamp < maxAge) {
              console.log(`[API] Serving from cache: ${originalRequest.url}`);
              return {
                ...error.response,
                data,
                headers: { ...headers, 'x-cached': 'true' },
                status: 200,
                statusText: 'OK (Cached)'
              };
            }
          } catch (e) {
            console.error('Error reading from cache:', e);
          }
        }
      }
      
      // For other methods or when no cache is available, reject with offline error
      const offlineError = new Error('You are currently offline. Your request will be processed when you are back online.');
      offlineError.isOffline = true;
      offlineError.code = 'OFFLINE';
      return Promise.reject(offlineError);
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Only redirect if not already on the login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
    
    // Handle network errors and retries
    if (
      !originalRequest._retry && 
      error.code !== 'ECONNABORTED' && 
      (!error.response || error.response.status >= 500)
    ) {
      originalRequest._retry = originalRequest._retry || 0;
      
      if (originalRequest._retry < MAX_RETRIES) {
        originalRequest._retry += 1;
        
        // Exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, originalRequest._retry - 1);
        
        return new Promise((resolve) => {
          setTimeout(() => resolve(api(originalRequest)), delay);
        });
      }
    }
    
    // Format error message
    let errorMessage = 'An error occurred';
    
    if (error.response) {
      // Server responded with a status code outside 2xx
      const { data } = error.response;
      errorMessage = data?.message || 
                    data?.error?.message || 
                    error.response.statusText || 
                    'Request failed';
      
      // Add more context for common errors
      if (error.response.status === 404) {
        errorMessage = 'The requested resource was not found';
      } else if (error.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'No response from server. Please check your connection.';
    } else {
      // Something happened in setting up the request
      errorMessage = error.message || 'Request setup failed';
    }
    
    // Create a new error with formatted message
    const enhancedError = new Error(errorMessage);
    enhancedError.status = error.response?.status;
    enhancedError.code = error.code;
    enhancedError.details = error.response?.data?.details;
    
    // Show error toast for non-cancelled requests
    if (error.code !== 'ERR_CANCELED') {
      toast.error(errorMessage, { 
        position: 'top-right',
        duration: 5000
      });
    }
    
    return Promise.reject(enhancedError);
  }
);

// Helper function to handle API responses
const handleResponse = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response.data;
  }
  throw new Error(response.statusText);
};

// Helper function to handle errors
const handleError = (error) => {
  // Don't log cancelled requests or offline errors
  if (error.code !== 'ERR_CANCELED' && error.code !== 'OFFLINE') {
    console.error('API Error:', error);
  }
  throw error;
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials).then(handleResponse).catch(handleError),
  register: (userData) => api.post('/users/register', userData).then(handleResponse).catch(handleError),
  getProfile: () => api.get('/users/profile').then(handleResponse).catch(handleError),
  updateProfile: (userData) => api.put('/users/profile', userData).then(handleResponse).catch(handleError),
  getUsers: () => api.get('/users').then(handleResponse).catch(handleError),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData).then(handleResponse).catch(handleError),
  deleteUser: (id) => api.delete(`/users/${id}`).then(handleResponse).catch(handleError),
  updateProfile: (userData) => api.put('/users/profile', userData),
  getUsers: () => api.get('/users'),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Inventory API
export const inventoryAPI = {
  getCategories: () => api.get('/inventory/categories'),
  addCategory: (categoryData) => api.post('/inventory/categories', categoryData),
  getProducts: (params) => api.get('/inventory/products', { params }),
  getProduct: (id) => api.get(`/inventory/products/${id}`),
  addProduct: (productData) => api.post('/inventory/products', productData),
  updateProduct: (id, productData) => api.put(`/inventory/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/inventory/products/${id}`),
  getAvailableProducts: () => api.get('/inventory/products/available'),
};

// Orders API
export const ordersAPI = {
  getClients: () => api.get('/orders/clients'),
  addClient: (clientData) => api.post('/orders/clients', clientData),
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (orderData) => api.post('/orders', orderData),
  updateOrder: (id, orderData) => api.put(`/orders/${id}`, orderData),
  markReturned: (id) => api.put(`/orders/${id}/return`),
  requestDiscount: (id, discountData) => api.post(`/orders/${id}/discount/request`, discountData),
  approveDiscount: (id, approvalData) => api.put(`/orders/${id}/discount/approve`, approvalData),
  updatePayment: (id, paymentData) => api.put(`/orders/${id}/payment`, paymentData),
  getViolations: () => api.get('/orders/violations'),
  resolveViolation: (id) => api.put(`/orders/violations/${id}/resolve`),
};

// Casual Workers API
export const casualsAPI = {
  getWorkers: () => api.get('/casuals/workers'),
  addWorker: (workerData) => api.post('/casuals/workers', workerData),
  updateWorker: (id, workerData) => api.put(`/casuals/workers/${id}`, workerData),
  recordAttendance: (attendanceData) => api.post('/casuals/attendance', attendanceData),
  getAttendance: (params) => api.get('/casuals/attendance', { params }),
  calculateRemuneration: (id, params) => api.get(`/casuals/${id}/remuneration`, { params }),
  getRemunerationSummary: (params) => api.get('/casuals/remuneration-summary', { params }),
};

// Transactions API
export const transactionsAPI = {
  recordPurchase: (purchaseData) => api.post('/transactions/purchases', purchaseData),
  getPurchases: (params) => api.get('/transactions/purchases', { params }),
  recordRepair: (repairData) => api.post('/transactions/repairs', repairData),
  getRepairs: (params) => api.get('/transactions/repairs', { params }),
  updateRepair: (id, repairData) => api.put(`/transactions/repairs/${id}`, repairData),
  getTransactionSummary: (params) => api.get('/transactions/summary', { params }),
};

// Reports API
export const reportsAPI = {
  generateInvoice: (orderId) => api.get(`/reports/invoices/${orderId}`),
  generateReceipt: (orderId) => api.get(`/reports/receipts/${orderId}`),
  getDiscountApprovals: (params) => api.get('/reports/discount-approvals', { params }),
  getCasualRemunerationSummary: (params) => api.get('/reports/casual-remuneration-summary', { params }),
  getInventoryStatus: () => api.get('/reports/inventory-status'),
  getOverdueReturns: () => api.get('/reports/overdue-returns'),
};

export default api;