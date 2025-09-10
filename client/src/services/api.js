import axios from 'axios';

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

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime(),
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Network error occurred. Please check your connection.';
    
    // Create a new error with formatted message
    const enhancedError = new Error(errorMessage);
    enhancedError.status = error.response?.status;
    enhancedError.code = error.code;
    
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
  console.error('API Error:', error);
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