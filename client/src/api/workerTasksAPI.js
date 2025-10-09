// Import the base API instance
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = {
  get: async (url, config = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}${config.params ? '?' + new URLSearchParams(config.params) : ''}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...config.headers
      }
    });
    return response.json();
  },
  
  post: async (url, data, config = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  put: async (url, data, config = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  delete: async (url, config = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...config.headers
      }
    });
    return response.json();
  }
};

export const workerTasksAPI = {
  tasks: {
    list: (params) => api.get('/worker-tasks', { params }),
    get: (id) => api.get(`/worker-tasks/${id}`),
    create: (data) => api.post('/worker-tasks', data),
    update: (id, data) => api.put(`/worker-tasks/${id}`, data),
    delete: (id) => api.delete(`/worker-tasks/${id}`),
    getEarnings: (workerId, params) => api.get(`/worker-tasks/earnings`, { params: { workerId, ...params } })
  }
};