import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  getProfile: () => api.get('/users/profile'),
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