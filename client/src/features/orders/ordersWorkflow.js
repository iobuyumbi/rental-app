import { ordersAPI } from "../../services/api";
import { workerTasksAPI } from "../../api/workerTasksAPI";

export async function updateOrderStatusAndRecordTask({
  order,
  statusData,
  onInventoryUpdated,
}) {
  const updateData = {
    status: statusData.status,
    totalAmount: statusData.adjustedAmount,
    actualReturnDate: statusData.actualDate,
    chargeableDays: statusData.chargeableDays,
    usageCalculation: statusData.calculations,
  };

  await ordersAPI.updateOrder(order._id, updateData);

  const shouldRecordTask =
    statusData.status === "in_progress" || statusData.status === "completed";

  if (shouldRecordTask) {
    const taskPayload = {
      order: order._id,
      taskType: statusData.status === "completed" ? "return" : "issue",
      taskAmount: statusData.adjustedAmount || 0,
      workers: (statusData.workers || []).map((w) => ({
        worker: w.workerId || w.worker || w._id,
        present: Boolean(w.present ?? true),
      })),
      completedAt: statusData.actualDate || new Date().toISOString(),
    };
    await workerTasksAPI.tasks.create(taskPayload);
  }

  if (typeof onInventoryUpdated === "function") {
    onInventoryUpdated();
  }

  return { updated: true, taskRecorded: shouldRecordTask };
}
