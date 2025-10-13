import api from "./http";

const handleResponse = (response) => response.data ?? response;

export const workerTasksAPI = {
  tasks: {
    list: (params) => api.get("/worker-tasks", { params }).then(handleResponse),
    get: (id) => api.get(`/worker-tasks/${id}`).then(handleResponse),
    create: (data) => api.post("/worker-tasks", data).then(handleResponse),
    update: (id, data) =>
      api.put(`/worker-tasks/${id}`, data).then(handleResponse),
    delete: (id) => api.delete(`/worker-tasks/${id}`).then(handleResponse),
    getEarnings: (workerId, params) =>
      api
        .get(`/worker-tasks/earnings`, { params: { workerId, ...params } })
        .then(handleResponse),
  },
};
