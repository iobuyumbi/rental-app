import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Package,
  PackageCheck,
  Truck,
  TruckIcon,
  Users,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import WorkerTaskModal from "../worker-tasks/WorkerTaskModal";
import { createWorkerTask } from "../../features/orders/tasks";
import { calculateTaskAmount } from "./TaskCalculator";

const OrderWorkflowButtons = ({
  order,
  workers = [],
  onTaskCreated,
  disabled = false,
}) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState(null);

  // Define task types with their specific configurations
  const taskTypes = [
    {
      id: "arranging_pickup",
      label: "Arranging for Pickup",
      icon: Package,
      color: "bg-blue-500 hover:bg-blue-600",
      description: "Record workers who arranged items for client pickup",
      defaultAmount: 500,
      phase: "pickup",
    },
    {
      id: "issuing",
      label: "Issuing Items",
      icon: Package,
      color: "bg-blue-600 hover:bg-blue-700",
      description: "Record workers who issued items to client",
      defaultAmount: 500,
      phase: "pickup",
    },
    {
      id: "loading",
      label: "Loading Vehicle",
      icon: Truck,
      color: "bg-orange-500 hover:bg-orange-600",
      description: "Record workers who loaded truck/pickup for delivery",
      defaultAmount: 300,
      phase: "pickup",
    },
    {
      id: "transport",
      label: "Transport/Delivery",
      icon: Users,
      color: "bg-indigo-500 hover:bg-indigo-600",
      description: "Record transport/delivery workers",
      defaultAmount: 800,
      phase: "pickup",
    },
    {
      id: "unloading",
      label: "Unloading at Site",
      icon: TruckIcon,
      color: "bg-purple-500 hover:bg-purple-600",
      description: "Record workers who unloaded items at client site",
      defaultAmount: 300,
      phase: "pickup",
    },
    {
      id: "receiving",
      label: "Receiving Returns",
      icon: PackageCheck,
      color: "bg-green-500 hover:bg-green-600",
      description: "Record workers who received returned items from client",
      defaultAmount: 400,
      phase: "return",
    },
    {
      id: "loading_returns",
      label: "Loading Returns",
      icon: Truck,
      color: "bg-orange-600 hover:bg-orange-700",
      description: "Record workers who loaded returned items for transport",
      defaultAmount: 300,
      phase: "return",
    },
    {
      id: "transport_returns",
      label: "Transport Returns",
      icon: Users,
      color: "bg-indigo-600 hover:bg-indigo-700",
      description: "Record workers who transported returned items",
      defaultAmount: 600,
      phase: "return",
    },
    {
      id: "unloading_returns",
      label: "Unloading Returns",
      icon: TruckIcon,
      color: "bg-purple-600 hover:bg-purple-700",
      description: "Record workers who unloaded returns at warehouse",
      defaultAmount: 300,
      phase: "return",
    },
    {
      id: "storing",
      label: "Storing Items",
      icon: PackageCheck,
      color: "bg-green-600 hover:bg-green-700",
      description: "Record workers who put returned items back in storage",
      defaultAmount: 400,
      phase: "return",
    },
  ];

  const handleTaskTypeClick = (taskType) => {
    if (disabled) {
      toast.error("Cannot record tasks for this order status");
      return;
    }

    setSelectedTaskType(taskType);
    setShowTaskModal(true);
  };
  
  const getTaskLabel = (taskType) => {
    switch (taskType) {
      case 'pickup':
        return 'Pickup Task';
      case 'delivery':
        return 'Delivery Task';
      case 'storage':
        return 'Storage Task';
      default:
        return 'Worker Task';
    }
  };

  const handleTaskSubmit = async (taskData) => {
    try {
      const payload = { ...taskData, taskType: selectedTaskType.id };
      if (onTaskCreated) {
        await onTaskCreated(payload);
      } else {
        await createWorkerTask(payload);
      }

      setShowTaskModal(false);
      setSelectedTaskType(null);

      toast.success(`${selectedTaskType.label} recorded successfully`);
    } catch (error) {
      console.error("Error creating task:", error);
      throw error; // Let WorkerTaskModal handle the error display
    }
  };

  const handleCloseModal = () => {
    setShowTaskModal(false);
    setSelectedTaskType(null);
  };

  // Calculate suggested amount based on order items and task type
  const calculateSuggestedAmount = (taskType) => {
    if (!order.items || order.items.length === 0) {
      return taskType.defaultAmount;
    }

    // Use automatic calculation based on items
    const calculatedAmount = calculateTaskAmount(order.items, taskType.id);

    // Use calculated amount if available, otherwise fall back to default
    return calculatedAmount > 0 ? calculatedAmount : taskType.defaultAmount;
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Worker Task Recording</h3>
          <div className="text-sm text-gray-500">
            Record worker participation throughout the order lifecycle
          </div>
        </div>

        {/* Pickup Phase */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h4 className="text-md font-medium text-gray-800">
              Pickup & Delivery Phase
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {taskTypes
              .filter((task) => task.phase === "pickup")
              .map((taskType) => {
                const IconComponent = taskType.icon;
                const suggestedAmount = calculateSuggestedAmount(taskType);

                return (
                  <Button
                    key={taskType.id}
                    onClick={() => handleTaskTypeClick(taskType)}
                    disabled={disabled}
                    className={`${taskType.color} text-white flex flex-col items-center p-3 h-auto space-y-1`}
                    variant="default"
                    size="sm"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {taskType.label}
                    </span>
                    <span className="text-xs opacity-90">
                      KES {suggestedAmount.toLocaleString()}
                    </span>
                  </Button>
                );
              })}
          </div>
        </div>

        {/* Return Phase */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h4 className="text-md font-medium text-gray-800">
              Return & Storage Phase
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {taskTypes
              .filter((task) => task.phase === "return")
              .map((taskType) => {
                const IconComponent = taskType.icon;
                const suggestedAmount = calculateSuggestedAmount(taskType);

                return (
                  <Button
                    key={taskType.id}
                    onClick={() => handleTaskTypeClick(taskType)}
                    disabled={disabled}
                    className={`${taskType.color} text-white flex flex-col items-center p-3 h-auto space-y-1`}
                    variant="default"
                    size="sm"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {taskType.label}
                    </span>
                    <span className="text-xs opacity-90">
                      KES {suggestedAmount.toLocaleString()}
                    </span>
                  </Button>
                );
              })}
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Complete Order Lifecycle:</strong> Track worker participation
          from initial pickup preparation through final storage. Each task
          calculates fair remuneration based on items and effort required. Lunch
          allowances are automatically generated for participating workers.
        </div>
      </div>

      {/* Worker Task Modal */}
      {showTaskModal && selectedTaskType && (
        <WorkerTaskModal
          isOpen={showTaskModal}
          onClose={handleCloseModal}
          order={order}
          workers={workers}
          onSubmit={handleTaskCreated}
          taskTypePreset={{
            type: selectedTaskType.id,
            label: selectedTaskType.label,
            suggestedAmount: calculateSuggestedAmount(selectedTaskType),
            description: selectedTaskType.description
          }}
        />
      )}
    </>
  );
};

export default OrderWorkflowButtons;
