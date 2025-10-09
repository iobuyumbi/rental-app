import axios from 'axios';
import { workerTasksAPI } from '../api/workerTasksAPI';
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
    get: () => api.get('/inventory/categories').then(handleResponse).catch(handleError),
    create: (categoryData) => api.post('/inventory/categories', categoryData).then(handleResponse).catch(handleError),
    update: (id, categoryData) => api.put(`/inventory/categories/${id}`, categoryData).then(handleResponse).catch(handleError),
    delete: (id) => api.delete(`/inventory/categories/${id}`).then(handleResponse).catch(handleError)
  },
  
  // Products
  products: {
    get: () => api.get('/inventory/products').then(handleResponse).catch(handleError),
    getById: (id) => api.get(`/inventory/products/${id}`).then(handleResponse).catch(handleError),
    create: (productData) => api.post('/inventory/products', productData).then(handleResponse).catch(handleError),
    update: (id, productData) => api.put(`/inventory/products/${id}`, productData).then(handleResponse).catch(handleError),
    delete: (id) => api.delete(`/inventory/products/${id}`).then(handleResponse).catch(handleError)
  },
  
  // Convenience methods for inventory management
  getProduct: (id) => api.get(`/inventory/products/${id}`).then(handleResponse).catch(handleError),
  updateProduct: (id, productData) => api.put(`/inventory/products/${id}`, productData).then(handleResponse).catch(handleError),
  
  // Available products (heavily cached)
  getAvailableProducts: () => 
    api.get('/inventory/products/available', {
      headers: { 'x-cache-max-age': '300000' } // 5 minutes
    }).then(handleResponse).catch(handleError)
};

// Orders API
export const ordersAPI = {
  getClients: () => api.get('/clients').then(handleResponse).catch(handleError),
  getClient: (id) => api.get(`/clients/${id}`).then(handleResponse).catch(handleError),
  addClient: (clientData) => api.post('/clients', clientData).then(handleResponse).catch(handleError),
  updateClient: (id, clientData) => api.put(`/clients/${id}`, clientData).then(handleResponse).catch(handleError),
  deleteClient: (id) => api.delete(`/clients/${id}`).then(handleResponse).catch(handleError),
  getOrders: (params) => api.get('/orders', { params }).then(handleResponse).catch(handleError),
  getOrder: (id) => api.get(`/orders/${id}`).then(handleResponse).catch(handleError),
  createOrder: (orderData) => api.post('/orders', orderData).then(handleResponse).catch(handleError),
  updateOrder: (id, orderData) => api.put(`/orders/${id}`, orderData).then(handleResponse).catch(handleError),
  deleteOrder: (id) => api.delete(`/orders/${id}`).then(handleResponse).catch(handleError),
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
    get: () => api.get('/workers').then(handleResponse).catch(handleError),
    create: (data) => api.post('/workers', data).then(handleResponse).catch(handleError),
    update: (id, data) => api.put(`/workers/${id}`, data).then(handleResponse).catch(handleError)
  },
  // Attendance tracking
  attendance: {
    list: () => api.get('/workers/attendance').then(handleResponse).catch(handleError),
    record: (data) => api.post('/workers/attendance', data).then(handleResponse).catch(handleError)
  },
  // Remuneration calculation
  remuneration: {
    calculate: (workerId, params = {}) => {
      return api.get(`/workers/${workerId}/remuneration`, { params }).then(handleResponse).catch(handleError);
    }
  },
  // Summary data
  getSummary: (workerId, params = {}) => {
    return api.get(`/task-completions/worker/${workerId}/summary`, {
      params,
      timeout: 10000
    }).then(handleResponse).catch(handleError);
  }
};


// Lunch Allowance API
export const lunchAllowanceAPI = {
  getAll: (params = {}) => {
    return api.get('/lunch-allowances', { params }).then(handleResponse).catch(handleError);
  },
  generate: (data) => api.post('/lunch-allowances/generate', data).then(handleResponse).catch(handleError),
  update: (id, data) => api.put(`/lunch-allowances/${id}`, data).then(handleResponse).catch(handleError),
  delete: (id) => api.delete(`/lunch-allowances/${id}`).then(handleResponse).catch(handleError),
  getSummary: (params = {}) => {
    return api.get('/lunch-allowances/summary', { params }).then(handleResponse).catch(handleError);
  }
};

// Transactions API
export const transactionsAPI = {
  getLaborCosts: (params) => api.get('/transactions/labor', { params }).then(handleResponse).catch(handleError),
  getLunchAllowanceCosts: (params) => api.get('/transactions/lunch-allowances', { params }).then(handleResponse).catch(handleError),
  getPurchases: (dateRange) => api.get('/transactions/purchases', { params: dateRange }).then(handleResponse).catch(handleError),
  recordPurchase: (data) => api.post('/transactions/purchases', data).then(handleResponse).catch(handleError),
  getRepairs: (dateRange) => api.get('/transactions/repairs', { params: dateRange }).then(handleResponse).catch(handleError),
  recordRepair: (data) => api.post('/transactions/repairs', data).then(handleResponse).catch(handleError),
  updateRepair: (id, data) => api.put(`/transactions/repairs/${id}`, data).then(handleResponse).catch(handleError),
  getTransactionSummary: (dateRange) => api.get('/transactions/summary', { params: dateRange }).then(handleResponse).catch(handleError)
};

// Task Rate API
export const taskRateAPI = {
  getAll: (params) => api.get('/task-rates', { params }).then(handleResponse).catch(handleError),
  getById: (id) => api.get(`/task-rates/${id}`).then(handleResponse).catch(handleError),
  create: (data) => api.post('/task-rates', data).then(handleResponse).catch(handleError),
  update: (id, data) => api.put(`/task-rates/${id}`, data).then(handleResponse).catch(handleError),
  delete: (id) => api.delete(`/task-rates/${id}`).then(handleResponse).catch(handleError),
  getByType: (taskType) => api.get(`/task-rates/by-type/${taskType}`).then(handleResponse).catch(handleError)
};

// Task Completion API
export const taskCompletionAPI = {
  getAll: (params) => api.get('/task-completions', { params }).then(handleResponse).catch(handleError),
  getById: (id) => api.get(`/task-completions/${id}`).then(handleResponse).catch(handleError),
  record: (data) => api.post('/task-completions', data).then(handleResponse).catch(handleError),
  update: (id, data) => api.put(`/task-completions/${id}`, data).then(handleResponse).catch(handleError),
  verify: (id, data) => api.put(`/task-completions/${id}/verify`, data).then(handleResponse).catch(handleError),
  getWorkerSummary: (workerId, params) => api.get(`/task-completions/worker/${workerId}/summary`, { params }).then(handleResponse).catch(handleError)
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
    
  // Worker reports - Use worker tasks API instead of non-existent reports endpoint
  workerRemuneration: async (params = {}) => {
    try {
      // Check if we have the workerTasksAPI available
      if (typeof workerTasksAPI !== 'undefined' && workerTasksAPI.tasks && workerTasksAPI.tasks.list) {
        console.log('Using workerTasksAPI for remuneration data');
        const response = await workerTasksAPI.tasks.list(params);
        const tasks = response?.data || response || [];
        
        if (!Array.isArray(tasks)) {
          console.warn('WorkerTasksAPI returned non-array data:', tasks);
          return [];
        }
        
        return processTasksForRemuneration(tasks);
      }
      
      // Fallback: try the direct API call
      console.log('Trying direct /worker-tasks API call');
      const response = await api.get('/worker-tasks', {
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
          ...params
        },
        timeout: 10000
      });
      
      const tasks = response?.data || response || [];
      
      // Debug: Log the response to see what we're getting
      console.log('Worker tasks API response:', response);
      console.log('Tasks data:', tasks);
      console.log('Is tasks an array?', Array.isArray(tasks));
      
      // Ensure tasks is an array
      if (!Array.isArray(tasks)) {
        console.warn('Tasks is not an array, returning empty remuneration data');
        return [];
      }
      
      return processTasksForRemuneration(tasks);
    } catch (error) {
      console.error('Error fetching worker remuneration:', error);
      // Return empty array instead of throwing
      return [];
    }
  },
    
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
    }).then(handleResponse).catch(handleError)
  
  // Note: Export and analytics endpoints are not implemented on the server
};

// Helper function to process tasks for remuneration calculation
const processTasksForRemuneration = (tasks) => {
  try {
    // Process tasks to create remuneration summary
    const remunerationSummary = {};
    
    tasks.forEach(task => {
      if (task.workers && Array.isArray(task.workers)) {
        task.workers.forEach(workerEntry => {
          if (workerEntry.present && workerEntry.worker) {
            const workerId = workerEntry.worker._id || workerEntry.worker;
            const workerName = workerEntry.worker.name || workerEntry.worker;
            
            if (!remunerationSummary[workerId]) {
              remunerationSummary[workerId] = {
                workerId,
                workerName,
                totalAmount: 0,
                taskCount: 0,
                tasks: []
              };
            }
            
            // Calculate worker's share of the task amount
            const presentWorkers = task.workers.filter(w => w.present).length;
            const workerShare = presentWorkers > 0 ? task.taskAmount / presentWorkers : 0;
            
            remunerationSummary[workerId].totalAmount += workerShare;
            remunerationSummary[workerId].taskCount += 1;
            remunerationSummary[workerId].tasks.push({
              taskId: task._id,
              taskType: task.taskType,
              orderId: task.order?._id || task.order,
              amount: workerShare,
              date: task.completedAt || task.createdAt
            });
          }
        });
      }
    });
    
    return Object.values(remunerationSummary);
  } catch (error) {
    console.error('Error processing tasks for remuneration:', error);
    return [];
  }
};

export default api;
