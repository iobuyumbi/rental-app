import { workerTasksAPI } from "../../api/workerTasksAPI";

export async function createWorkerTask(taskData) {
  const response = await workerTasksAPI.tasks.create(taskData);
  return response?.data || response;
}

export async function updateWorkerTask(taskId, taskData) {
  const response = await workerTasksAPI.tasks.update(taskId, taskData);
  return response?.data || response;
}

export async function deleteWorkerTask(taskId) {
  const response = await workerTasksAPI.tasks.delete(taskId);
  return response?.data || response;
}
