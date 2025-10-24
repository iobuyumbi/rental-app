import React from 'react';
import WorkerTaskModal from '../worker-tasks/WorkerTaskModal';
import EnhancedOrderStatusManager from './EnhancedOrderStatusManager';
import StatusChangeHandler from './StatusChangeHandler';

/**
 * OrderWorkflowSection - Manages all workflow-related modals and handlers
 * Extracted from OrdersPage to separate workflow concerns
 */
const OrderWorkflowSection = ({
  // Worker Task Modal props
  showWorkerTaskModal,
  setShowWorkerTaskModal,
  selectedOrder,
  setSelectedOrder,
  editingTask,
  setEditingTask,
  workers,
  handleSubmitWorkerTask,

  // Status Change Modal props
  showStatusModal,
  setShowStatusModal,
  statusChangeOrder,
  setStatusChangeOrder,
  handleStatusModalChange,

  // Workflow Handler props
  workflowContext,
  setWorkflowContext,
  handleWorkflowComplete,
  handleWorkflowOrderUpdate,
  setTaskHistoryRefresh,
  loadOrders,
}) => {
  const handleCloseWorkerTaskModal = () => {
    setShowWorkerTaskModal(false);
    setSelectedOrder(null);
    setEditingTask(null);
  };

  const handleStatusModalComplete = () => {
    setShowStatusModal(false);
    setStatusChangeOrder(null);
  };

  const handleWorkflowTaskCreated = async (taskData) => {
    console.log('Task created:', taskData);
    // Refresh task history and orders
    setTaskHistoryRefresh((prev) => prev + 1);
    await loadOrders();
  };

  return (
    <>
      {/* Worker Task Modal */}
      {showWorkerTaskModal && (
        <WorkerTaskModal
          isOpen={showWorkerTaskModal}
          onClose={handleCloseWorkerTaskModal}
          order={selectedOrder}
          workers={workers}
          onSubmit={handleSubmitWorkerTask}
          existingTask={editingTask}
        />
      )}

      {/* Enhanced Order Status Manager Modal */}
      {showStatusModal && statusChangeOrder && (
        <EnhancedOrderStatusManager
          isOpen={showStatusModal}
          onOpenChange={setShowStatusModal}
          order={statusChangeOrder}
          onStatusChange={handleStatusModalChange}
          onComplete={handleStatusModalComplete}
        />
      )}

      {/* Status Change Workflow Handler */}
      {workflowContext && (
        <StatusChangeHandler
          key={workflowContext.key}
          order={workflowContext.order}
          previousStatus={workflowContext.previousStatus}
          newStatus={workflowContext.newStatus}
          onTaskCreated={handleWorkflowTaskCreated}
          onComplete={handleWorkflowComplete}
          onOrderUpdate={handleWorkflowOrderUpdate}
        />
      )}
    </>
  );
};

export default OrderWorkflowSection;
