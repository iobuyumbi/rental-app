import React, { useMemo } from "react";
import { Button } from "../components/ui/enhanced-components.jsx";
import { PageContainer, PageHeader } from "../components/ui/enhanced-components.jsx";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

// Import our new modular components and hooks
import { useOrdersPageState } from "../hooks/useOrdersPageState";
import { useOrdersBusinessLogic } from "../hooks/useOrdersBusinessLogic";
import OrdersTable from "../components/orders/OrdersTable";
import OrderForm from "../components/orders/OrderForm";
import OrderDetailsSection from "../components/orders/OrderDetailsSection";
import OrderWorkflowSection from "../components/orders/OrderWorkflowSection";
import DailyTaskModal from "../components/worker-tasks/DailyTaskModal";

/**
 * Refactored OrdersPage - Now uses modular components and custom hooks
 * Much cleaner and more maintainable than the monolithic version
 */
const OrdersPage = () => {
  const { user } = useAuth();

  // Extract all state management to custom hook
  const {
    // Data
    orders,
    loading,
    error,
    clients,
    products,
    workers,

    // Modal states
    showAddOrder,
    setShowAddOrder,
    editingOrder,
    setEditingOrder,
    viewingOrder,
    setViewingOrder,
    showViewModal,
    setShowViewModal,

    // Worker task states
    showWorkerTaskModal,
    setShowWorkerTaskModal,
    selectedOrder,
    setSelectedOrder,
    editingTask,
    setEditingTask,
    taskHistoryRefresh,
    setTaskHistoryRefresh,

    // Status change states
    showStatusModal,
    setShowStatusModal,
    statusChangeOrder,
    setStatusChangeOrder,
    workflowContext,
    setWorkflowContext,

    // Daily task states
    showDailyTaskModal,
    setShowDailyTaskModal,

    // Product selection states
    productSearch,
    setProductSearch,
    selectedProduct,
    setSelectedProduct,
    quantity,
    setQuantity,
    orderItems,
    setOrderItems,

    // Form management
    orderForm,

    // API functions
    createOrder,
    updateOrder,
    deleteOrder,
    loadOrders,
    createWorkerTaskFn,
    updateWorkerTaskFn,

    // Utility functions
    loadSupportingData,
    loadWorkers,
    
    // State setters
    setClients,
  } = useOrdersPageState();

  // Extract all business logic to custom hook
  const {
    totals,
    addItemToOrder,
    updateItemQuantity,
    updateItemUnitPrice,
    updateItemDaysUsed,
    removeItem,
    handleSubmitWorkerTask,
    handleWorkflowTaskCreated,
    handleDeleteTaskFromHistory,
    handleStatusModalChange,
    handleWorkflowOrderUpdate,
  } = useOrdersBusinessLogic({
    orders,
    orderForm,
    orderItems,
    setOrderItems,
    setProductSearch,
    setSelectedProduct,
    setQuantity,
    loadOrders,
    createWorkerTaskFn,
    updateWorkerTaskFn,
    updateOrder,
    createOrder,
    user,
  });

  // Format client options for the dropdown
  const clientOptions = useMemo(() => {
    return clients.map((client) => ({
      ...client,
      label: client.name,
      value: client._id,
    }));
  }, [clients]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  // Order handlers
  const handleAddOrder = () => {
    setEditingOrder(null);
    setOrderItems([]);
    orderForm.reset();
    setShowAddOrder(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);

    // Map order items from database format to form format
    const mappedItems = (order.items || []).map((item) => ({
      productId: item.product?._id || item.product,
      productName: item.product?.name || item.productName || "Unknown Product",
      quantity: item.quantityRented || item.quantity || 1,
      unitPrice: item.unitPriceAtTimeOfRental || item.unitPrice || 0,
      priceModifiedBy: item.priceModifiedBy,
    }));

    setOrderItems(mappedItems);

    // Extract dates from consistent backend fields
    const startDate = order.rentalStartDate?.split("T")[0] || "";
    const endDate = order.rentalEndDate?.split("T")[0] || "";

    orderForm.updateValues({
      client: order.client?._id || order.client,
      startDate,
      endDate,
      status: order.status,
      paymentStatus: order.paymentStatus,
      deposit: order.deposit || 0,
      discount: order.discount || 0,
      taxRate: order.taxRate || 16,
      notes: order.notes || "",
      location: order.location || "",
      orderCompany: order.orderCompany || "",
    });
    setShowAddOrder(true);
  };

  const handleViewOrder = (order) => {
    setViewingOrder(order);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowAddOrder(false);
    setEditingOrder(null);
    setOrderItems([]);
    setProductSearch("");
    setSelectedProduct(null);
    setQuantity(1);
    orderForm.reset();
  };

  // Form submission handler
  const handleFormSubmit = async (formData, event) => {
    if (event) {
      event.preventDefault();
    }

    if (orderItems.length === 0) {
      toast.error("Please add at least one product to the order");
      return;
    }

    const orderData = {
      client: formData.client,
      rentalStartDate: formData.startDate,
      rentalEndDate: formData.endDate,
      items: orderItems,
      notes: formData.notes,
      deposit: parseFloat(formData.deposit) || 0,
      discount: parseFloat(formData.discount) || 0,
      taxRate: parseFloat(formData.taxRate) || 16,
      status: formData.status,
      paymentStatus: formData.paymentStatus,
      location: formData.location || "",
      orderCompany: formData.orderCompany || "",
    };

    try {
      let updatedOrder;

      if (editingOrder) {
        const previousStatus = editingOrder.status;
        const newStatus = orderData.status;

        updatedOrder = await updateOrder(editingOrder._id, orderData);
        toast.success("Order updated successfully");

        // Trigger status change handler if status changed to key states
        if (
          previousStatus !== newStatus &&
          (newStatus === "in_progress" || newStatus === "completed")
        ) {
          setWorkflowContext({
            order: { ...editingOrder, ...orderData },
            previousStatus,
            newStatus,
            key: Date.now(),
          });
        }
      } else {
        updatedOrder = await createOrder(orderData);
        toast.success("Order created successfully");

        // If initial status set to in_progress or completed, trigger status modal
        if (
          orderData.status === "in_progress" ||
          orderData.status === "completed"
        ) {
          setWorkflowContext({
            order: { ...updatedOrder, ...orderData },
            previousStatus: "pending",
            newStatus: orderData.status,
            key: Date.now(),
          });
        }
      }

      handleCloseModal();
      loadOrders();
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error(error.message || "Failed to save order");
    }
  };

  // Status change handlers
  const handleTableStatusChange = (order) => {
    setStatusChangeOrder(order);
    setShowStatusModal(true);
  };

  const handleStatusModalChangeWrapper = async (orderId, statusData) => {
    try {
      const result = await handleStatusModalChange(orderId, statusData);
      
      // Close the status modal on success
      setShowStatusModal(false);
      setStatusChangeOrder(null);

      // Trigger workflow handler for specific status changes
      if (
        (statusData.status === "in_progress" && result.previousStatus !== "in_progress") ||
        (statusData.status === "completed" && result.previousStatus === "in_progress")
      ) {
        setWorkflowContext({
          order: { ...result.order, ...statusData },
          previousStatus: result.previousStatus,
          newStatus: statusData.status,
          key: Date.now(),
        });
      }
    } catch (error) {
      // Error handling is done in the business logic hook
      throw error;
    }
  };

  const handleWorkflowComplete = () => {
    setWorkflowContext(null);
    setTaskHistoryRefresh((prev) => prev + 1);
  };

  // Task handlers for order details
  const handleEditTaskFromHistory = (task) => {
    setEditingTask(task);
    setSelectedOrder(viewingOrder);
    setShowWorkerTaskModal(true);
  };

  // Handler to open worker task modal for new tasks
  const handleWorkerTask = (order) => {
    setSelectedOrder(order);
    setEditingTask(null); // Clear any existing task being edited
    setShowWorkerTaskModal(true);
  };

  const handleAddNewClient = async (clientData) => {
    try {
      const { ordersAPI } = await import('../services/api');
      const newClient = await ordersAPI.addClient(clientData);
      // Update clients through the state hook
      await loadSupportingData();
      toast.success("New client created successfully!");
      return newClient;
    } catch (error) {
      console.error("Error creating new client:", error);
      toast.error("Failed to create new client");
      throw error;
    }
  };

  // Handler for daily task creation
  const handleDailyTaskCreated = (taskData) => {
    toast.success(`Daily task recorded for ${taskData.workerName}`);
    // Optionally refresh any data if needed
  };

  return (
    <PageContainer>
      <PageHeader
        title="Orders Management"
        description="Manage rental orders and track their status"
      >
        <div className="flex gap-2">
          <Button
            onClick={() => setShowDailyTaskModal(true)}
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            Record Daily Task
          </Button>
          <Button
            onClick={loadOrders}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </div>
      </PageHeader>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-800">
              <strong>Error loading orders:</strong> {error}
            </div>
            <Button
              onClick={loadOrders}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-50 border rounded-lg p-4 text-xs">
          <strong>Debug Info:</strong>
          Loading: {loading ? "Yes" : "No"} | Orders Count:{" "}
          {orders?.length || 0} | Error: {error || "None"} | API URL:{" "}
          {import.meta.env.VITE_API_URL || "http://localhost:5000/api"}
        </div>
      )}

      {/* Orders Table */}
      <OrdersTable
        orders={orders}
        loading={loading}
        onAddOrder={handleAddOrder}
        onEditOrder={handleEditOrder}
        onViewOrder={handleViewOrder}
        onDeleteOrder={deleteOrder}
        onStatusChange={handleTableStatusChange}
        onWorkerTask={handleWorkerTask}
      />

      {/* Order Form Modal */}
      <OrderForm
        isOpen={showAddOrder}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        formData={orderForm.values}
        onFormChange={orderForm.handleChange}
        errors={orderForm.errors}
        isSubmitting={orderForm.isSubmitting}
        editingOrder={editingOrder}
        clientOptions={clientOptions}
        onAddNewClient={handleAddNewClient}
        // Product selection props
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        quantity={quantity}
        setQuantity={setQuantity}
        filteredProducts={filteredProducts}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        orderItems={orderItems}
        onAddItem={() => addItemToOrder(selectedProduct, quantity)}
        onUpdateQuantity={updateItemQuantity}
        onUpdateUnitPrice={updateItemUnitPrice}
        onUpdateDaysUsed={updateItemDaysUsed}
        onRemoveItem={removeItem}
        totals={totals}
        currentUser={user}
      />

      {/* Order Details Modal - Now extracted to its own component */}
      <OrderDetailsSection
        viewingOrder={viewingOrder}
        showViewModal={showViewModal}
        setShowViewModal={setShowViewModal}
        workers={workers}
        handleEditTaskFromHistory={handleEditTaskFromHistory}
        handleDeleteTaskFromHistory={handleDeleteTaskFromHistory}
        handleWorkflowTaskCreated={handleWorkflowTaskCreated}
        taskHistoryRefresh={taskHistoryRefresh}
      />

      {/* All Workflow Components - Now extracted to their own section */}
      <OrderWorkflowSection
        // Worker Task Modal props
        showWorkerTaskModal={showWorkerTaskModal}
        setShowWorkerTaskModal={setShowWorkerTaskModal}
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
        editingTask={editingTask}
        setEditingTask={setEditingTask}
        workers={workers}
        handleSubmitWorkerTask={handleSubmitWorkerTask}
        // Status Change Modal props
        showStatusModal={showStatusModal}
        setShowStatusModal={setShowStatusModal}
        statusChangeOrder={statusChangeOrder}
        setStatusChangeOrder={setStatusChangeOrder}
        handleStatusModalChange={handleStatusModalChangeWrapper}
        // Workflow Handler props
        workflowContext={workflowContext}
        setWorkflowContext={setWorkflowContext}
        handleWorkflowComplete={handleWorkflowComplete}
        handleWorkflowOrderUpdate={handleWorkflowOrderUpdate}
        setTaskHistoryRefresh={setTaskHistoryRefresh}
        loadOrders={loadOrders}
      />

      {/* Daily Task Modal */}
      <DailyTaskModal
        isOpen={showDailyTaskModal}
        onClose={() => setShowDailyTaskModal(false)}
        onTaskCreated={handleDailyTaskCreated}
      />
    </PageContainer>
  );
};

export default OrdersPage;
