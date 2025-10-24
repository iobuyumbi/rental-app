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

  // Use the specific status update endpoint
  try {
    const response = await ordersAPI.updateOrderStatus(order._id, updateData);
    console.log("Order status updated successfully:", response);
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error("Failed to update order status. Please try again.");
  }

  const shouldRecordTask =
    (statusData.status === "in_progress" ||
      statusData.status === "completed") &&
    Array.isArray(statusData.workers) &&
    statusData.workers.length > 0;

  // Record worker task if needed
  if (shouldRecordTask) {
    try {
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
      
      const taskResponse = await workerTasksAPI.tasks.create(taskPayload);
      console.log("Worker task recorded successfully:", taskResponse);
    } catch (error) {
      console.error("Error recording worker task:", error);
      // Don't throw here - status update succeeded, task recording is secondary
    }
  }

  // Handle inventory updates for specific status changes
  if (statusData.status === "completed" || statusData.status === "cancelled") {
    if (typeof onInventoryUpdated === "function") {
      onInventoryUpdated();
    }
    
    // Trigger inventory refresh event
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("inventoryUpdated", { 
        detail: { orderId: order._id, status: statusData.status } 
      }));
    }
  }

  return { 
    updated: true, 
    taskRecorded: shouldRecordTask,
    status: statusData.status,
    orderId: order._id
  };
}
