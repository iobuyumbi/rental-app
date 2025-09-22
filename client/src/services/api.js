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
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle offline errors
    if (error.isOffline || !navigator.onLine) {
      console.log('Offline mode detected, request will be queued');
      // In a real app, you might queue this request for later
      throw new Error('You are offline. Please check your connection.');
    }
    
    // Handle network errors with retry logic
    if (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNABORTED' ||
      (error.response && error.response.status >= 500)
    ) {
      if (!originalRequest._retry && originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        
        console.log(`Retrying request (${originalRequest._retryCount}/${MAX_RETRIES})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        return api(originalRequest);
      }
    }
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Helper functions
const handleResponse = (response) => {
  // Handle different response formats from the server
  if (response.data?.success && response.data?.data) {
    return response.data.data; // Return the actual data from {success: true, data: {...}}
  }
  return response.data; // Return raw data for other formats
};

const handleError = (error) => {
  console.error('API Error:', error);
  
  let message = 'An error occurred';
  
  if (error.response) {
    // Server responded with error status
    message = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
  } else if (error.request) {
    // Request made but no response received
    message = 'No response from server. Please check your connection.';
  } else {
    // Something else happened
    message = error.message || 'Network error occurred';
  }
  
  throw new Error(message);
};

// Create offline-capable API endpoints
const createOfflineAPI = (endpoint, options = {}) => {
  const { cacheKey, maxAge = 300000, ttl = 300000 } = options;
  
  return {
    get: (params = {}) => 
      api.get(endpoint, { 
        params,
        headers: { 'x-cache-max-age': maxAge.toString() }
      }).then(handleResponse).catch(handleError),
      
    create: (data) => 
      api.post(endpoint, data).then(handleResponse).catch(handleError),
      
    update: (id, data) => 
      api.put(`${endpoint}/${id}`, data).then(handleResponse).catch(handleError),
      
    delete: (id) => 
      api.delete(`${endpoint}/${id}`).then(handleResponse).catch(handleError),
      
    getById: (id) => 
      api.get(`${endpoint}/${id}`, {
        headers: { 'x-cache-max-age': maxAge.toString() }
      }).then(handleResponse).catch(handleError)
  };
};

// Auth API
export const authAPI = {
  login: (credentials) => 
    api.post('/users/login', credentials, { 
      headers: { 'x-offline-key': 'auth' } 
    }).then(handleResponse).catch(handleError),
    
  register: (userData) => 
    api.post('/users/register', userData, { 
      headers: { 'x-offline-key': 'auth' } 
    }).then(handleResponse).catch(handleError),
    
  getProfile: () => 
    api.get('/users/profile', { 
      headers: { 'x-cache-max-age': '300000' } // 5 minutes
    }).then(handleResponse).catch(handleError),
    
  updateProfile: (userData) => 
    api.put('/users/profile', userData, { 
      headers: { 'x-offline-key': 'profile' } 
    }).then(handleResponse).catch(handleError),
    
  // User management
  users: createOfflineAPI('/users', { cacheKey: 'users' })
};

// Inventory API
export const inventoryAPI = {
  // Categories
  categories: {
    get: () => api.get('/inventory/categories').then(response => response.data?.data || response.data).catch(handleError),
    create: (categoryData) => api.post('/inventory/categories', categoryData).then(response => response.data?.data || response.data).catch(handleError),
    update: (id, categoryData) => api.put(`/inventory/categories/${id}`, categoryData).then(response => response.data?.data || response.data).catch(handleError),
    delete: (id) => api.delete(`/inventory/categories/${id}`).then(response => response.data?.data || response.data).catch(handleError)
  },
  
  // Products
  products: {
    get: () => api.get('/inventory/products').then(response => response.data?.data || response.data).catch(handleError),
    create: (productData) => api.post('/inventory/products', productData).then(response => response.data?.data || response.data).catch(handleError),
    update: (id, productData) => api.put(`/inventory/products/${id}`, productData).then(response => response.data?.data || response.data).catch(handleError),
    delete: (id) => api.delete(`/inventory/products/${id}`).then(response => response.data?.data || response.data).catch(handleError)
  },
  
  // Available products (heavily cached)
  getAvailableProducts: () => 
    api.get('/inventory/products/available', {
      headers: { 'x-cache-max-age': '300000' } // 5 minutes
    }).then(response => response.data?.data || response.data).catch(handleError)
};

// Orders API
export const ordersAPI = {
  getClients: () => api.get('/clients').then(handleResponse).catch(handleError),
  getClient: (id) => api.get(`/clients/${id}`).then(handleResponse).catch(handleError),
  addClient: (clientData) => api.post('/clients', clientData).then(handleResponse).catch(handleError),
  updateClient: (id, clientData) => api.put(`/clients/${id}`, clientData).then(handleResponse).catch(handleError),
  getOrders: (params) => api.get('/orders', { params }).then(handleResponse).catch(handleError),
  getOrder: (id) => api.get(`/orders/${id}`).then(handleResponse).catch(handleError),
  createOrder: (orderData) => api.post('/orders', orderData).then(handleResponse).catch(handleError),
  updateOrder: (id, orderData) => api.put(`/orders/${id}`, orderData).then(handleResponse).catch(handleError),
  markReturned: (id) => api.put(`/orders/${id}/return`).then(handleResponse).catch(handleError),
  requestDiscount: (id, discountData) => api.post(`/orders/${id}/discount/request`, discountData).then(handleResponse).catch(handleError),
  approveDiscount: (id, approvalData) => api.put(`/orders/${id}/discount/approve`, approvalData).then(handleResponse).catch(handleError),
  updatePayment: (id, paymentData) => api.put(`/orders/${id}/payment`, paymentData).then(handleResponse).catch(handleError),
  getViolations: (params) => api.get('/orders/violations', { params }).then(handleResponse).catch(handleError),
  getViolation: (id) => api.get(`/orders/violations/${id}`).then(handleResponse).catch(handleError),
  createViolation: (violationData) => api.post('/orders/violations', violationData).then(handleResponse).catch(handleError),
  updateViolation: (id, violationData) => api.put(`/orders/violations/${id}`, violationData).then(handleResponse).catch(handleError),
  resolveViolation: (id, resolutionData) => api.put(`/orders/violations/${id}/resolve`, resolutionData).then(handleResponse).catch(handleError),
  bulkResolveViolations: (violationIds, resolutionData) => api.put('/orders/violations/bulk-resolve', { violationIds, ...resolutionData }).then(handleResponse).catch(handleError),
  deleteViolation: (id) => api.delete(`/orders/violations/${id}`).then(handleResponse).catch(handleError),
  exportViolations: (params) => api.get('/orders/violations/export', { params, responseType: 'blob' }).then(handleResponse).catch(handleError)
};

// Workers API
export const workersAPI = {
  // Workers management
  workers: {
    get: () => api.get('/workers').then(response => response.data?.data || response.data).catch(handleError),
    create: (data) => api.post('/workers', data).then(response => response.data?.data || response.data).catch(handleError),
    update: (id, data) => api.put(`/workers/${id}`, data).then(response => response.data?.data || response.data).catch(handleError)
  },
  // Attendance tracking
  attendance: {
    list: () => api.get('/workers/attendance').then(response => response.data?.data || response.data).catch(handleError),
    record: (data) => api.post('/workers/attendance', data).then(response => response.data?.data || response.data).catch(handleError)
  },
  // Remuneration calculation
  remuneration: {
    calculate: (workerId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.get(`/workers/${workerId}/remuneration?${query}`);
    }
  },
  // Summary data
  getSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get('/workers/remuneration-summary', {
      params,
      timeout: 10000
    });
  }
};

// Keep casualsAPI as an alias for backward compatibility during transition
export const casualsAPI = workersAPI;

// Lunch Allowance API
export const lunchAllowanceAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/lunch-allowances?${query}`).then(response => response.data?.data || response.data).catch(handleError);
  },
  generate: (data) => api.post('/lunch-allowances/generate', data).then(response => response.data?.data || response.data).catch(handleError),
  update: (id, data) => api.put(`/lunch-allowances/${id}`, data).then(response => response.data?.data || response.data).catch(handleError),
  delete: (id) => api.delete(`/lunch-allowances/${id}`).then(response => response.data?.data || response.data).catch(handleError),
  getSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/lunch-allowances/summary?${query}`).then(response => response.data?.data || response.data).catch(handleError);
  }
};

// Transactions API
export const transactionsAPI = {
  getLaborCosts: (params) => api.get('/transactions/labor', { params }).then(handleResponse).catch(handleError),
  getLunchAllowanceCosts: (params) => api.get('/transactions/lunch-allowances', { params }).then(handleResponse).catch(handleError),
  getPurchases: (dateRange) => api.get('/transactions/purchases', { params: dateRange }),
  recordPurchase: (data) => api.post('/transactions/purchases', data),
  getRepairs: (dateRange) => api.get('/transactions/repairs', { params: dateRange }),
  recordRepair: (data) => api.post('/transactions/repairs', data),
  updateRepair: (id, data) => api.put(`/transactions/repairs/${id}`, data),
  getTransactionSummary: (dateRange) => api.get('/transactions/summary', { params: dateRange })
};

// Task Rate API
export const taskRateAPI = {
  getAll: (params) => api.get('/task-rates', { params }),
  getById: (id) => api.get(`/task-rates/${id}`),
  create: (data) => api.post('/task-rates', data),
  update: (id, data) => api.put(`/task-rates/${id}`, data),
  delete: (id) => api.delete(`/task-rates/${id}`),
  getByType: (taskType) => api.get(`/task-rates/by-type/${taskType}`)
};

// Task Completion API
export const taskCompletionAPI = {
  getAll: (params) => api.get('/task-completions', { params }),
  getById: (id) => api.get(`/task-completions/${id}`),
  record: (data) => api.post('/task-completions', data),
  update: (id, data) => api.put(`/task-completions/${id}`, data),
  verify: (id, notes) => api.put(`/task-completions/${id}/verify`, { notes }),
  getWorkerSummary: (workerId, params) => api.get(`/task-completions/worker/${workerId}/summary`, { params })
};

// Reports API
export const reportsAPI = {
  // Invoices
  invoices: {
    generate: (orderId) =>
      api.get(`/reports/invoices/${orderId}`, {
        headers: { 'x-cache-max-age': '0' }
      }).then(handleResponse).catch(handleError)
  },

  // Receipts
  receipts: {
    generate: (orderId) =>
      api.get(`/reports/receipts/${orderId}`, {
        headers: { 'x-cache-max-age': '0' }
      }).then(handleResponse).catch(handleError)
  },
  
  // Analytics
  // Discount approvals
  discountApprovals: (params = {}) =>
    api.get('/reports/discount-approvals', {
      params,
      headers: { 'x-cache-max-age': '300000' } // 5 minutes
    }).then(handleResponse).catch(handleError),
    
  // Worker reports
  casualRemuneration: (params = {}) =>
    api.get('/reports/worker-remuneration-summary', {
      params,
      headers: { 'x-cache-max-age': '3600000' } // 1 hour
    }).then(handleResponse).catch(handleError),
    
  // Inventory status
  inventoryStatus: () =>
    api.get('/reports/inventory-status', {
      headers: { 'x-cache-max-age': '300000' } // 5 minutes
    }).then(handleResponse).catch(handleError),
    
  // Overdue returns
  overdueReturns: (params = {}) =>
    api.get('/reports/overdue-returns', {
      params,
      headers: { 'x-cache-max-age': '300000' } // 5 minutes
    }).then(handleResponse).catch(handleError),
    
  // Note: Export and analytics endpoints are not implemented on the server
};

export default api;
