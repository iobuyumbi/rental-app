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
    defaultChargeableDays: statusData.chargeableDays,
    chargeableDays: statusData.chargeableDays,
    usageCalculation: statusData.calculations,
  };

  // Ensure we're using the correct endpoint
  try {
    await ordersAPI.updateOrder(order._id, updateData);
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error("Failed to update order status. Please try again.");
  }

  const shouldRecordTask =
    (statusData.status === "in_progress" ||
      statusData.status === "completed") &&
    Array.isArray(statusData.workers) &&
    statusData.workers.length > 0;

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
