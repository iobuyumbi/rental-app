import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
} from "lucide-react";
import { workerTasksAPI } from "../api/workerTasksAPI";
import {
  createWorkerTask,
  updateWorkerTask,
  deleteWorkerTask,
} from "../features/orders/tasks";
import { formatDate, formatCurrency } from "../utils/formatters";
import { ordersAPI, workersAPI } from "../services/api";
import WorkerTaskModal from "../components/worker-tasks/WorkerTaskModal";

const WorkerTasksPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [workers, setWorkers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchSupportingData();
  }, []);

  const fetchSupportingData = async () => {
    try {
      const [workersRes, ordersRes] = await Promise.all([
        workersAPI.workers.get(),
        ordersAPI.getOrders({}),
      ]);

      const workersData = workersRes?.data || workersRes || [];
      const ordersData = ordersRes?.data || ordersRes || [];

      setWorkers(Array.isArray(workersData) ? workersData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load supporting data",
        variant: "destructive",
      });
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await workerTasksAPI.tasks.list();
      const tasksData = response?.data || response || [];
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error("Error loading worker tasks:", error);
      setTasks([]); // Ensure tasks is always an array
      toast({
        title: "Error",
        description: "Failed to load worker tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Worker task modal handlers
  const handleOpenTaskModal = (order = null) => {
    setSelectedOrder(order);
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setSelectedOrder(task.order);
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setSelectedOrder(null);
    setEditingTask(null);
  };

  const handleSubmitTask = async (taskData) => {
    try {
      if (editingTask) {
        await updateWorkerTask(editingTask._id, taskData);
        toast({
          title: "Success",
          description: "Worker task updated successfully",
        });
      } else {
        await createWorkerTask(taskData);
        toast({
          title: "Success",
          description: "Worker task created successfully",
        });
      }
      handleCloseTaskModal();
      fetchTasks();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to save worker task",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteWorkerTask(taskId);
      toast({
        title: "Success",
        description: "Worker task deleted successfully",
      });
      fetchTasks();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete worker task",
        variant: "destructive",
      });
    }
  };

  // Note: handleEditTask is defined above; removed duplicate to avoid re-declaration

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (value) => {
    setFilterType(value);
  };

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const filteredTasks = (Array.isArray(tasks) ? tasks : []).filter((task) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      task.order?.client?.name?.toLowerCase().includes(searchLower) ||
      task._id.toLowerCase().includes(searchLower) ||
      task.taskType.toLowerCase().includes(searchLower);

    // Type filter
    const matchesType = filterType === "all" || task.taskType === filterType;

    // Date filter
    let matchesDate = true;
    if (dateRange.startDate && dateRange.endDate) {
      const taskDate = new Date(task.completedAt);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59); // Include the entire end day

      matchesDate = taskDate >= startDate && taskDate <= endDate;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const getTaskTypeLabel = (type) => {
    const types = {
      issuing: "Issuing Items",
      receiving: "Receiving Items",
      loading: "Loading",
      unloading: "Unloading",
      other: "Other Task",
    };
    return types[type] || type;
  };

  const getTaskTypeColor = (type) => {
    const colors = {
      issuing: "bg-blue-100 text-blue-800",
      receiving: "bg-green-100 text-green-800",
      loading: "bg-amber-100 text-amber-800",
      unloading: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Worker Tasks</h1>
          <p className="text-gray-500">Manage worker tasks and remuneration</p>
        </div>
        <Button onClick={() => handleOpenTaskModal()}>
          <Plus className="mr-2 h-4 w-4" /> Record Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-2xl font-bold">
                {Array.isArray(tasks) ? tasks.length : 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-2xl font-bold">
                {formatCurrency(
                  (Array.isArray(tasks) ? tasks : []).reduce(
                    (sum, task) => sum + task.taskAmount,
                    0
                  )
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-2xl font-bold">
                {formatCurrency(
                  (Array.isArray(tasks) ? tasks : [])
                    .filter((task) => {
                      const taskDate = new Date(task.completedAt);
                      const now = new Date();
                      return (
                        taskDate.getMonth() === now.getMonth() &&
                        taskDate.getFullYear() === now.getFullYear()
                      );
                    })
                    .reduce((sum, task) => sum + task.taskAmount, 0)
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by order, client, or task type..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400 h-4 w-4" />
          <Select value={filterType} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="issuing">Issuing Items</SelectItem>
              <SelectItem value="receiving">Receiving Items</SelectItem>
              <SelectItem value="loading">Loading</SelectItem>
              <SelectItem value="unloading">Unloading</SelectItem>
              <SelectItem value="other">Other Tasks</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => handleDateChange("startDate", e.target.value)}
            className="w-[150px]"
          />
          <span className="text-gray-500">to</span>
          <Input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => handleDateChange("endDate", e.target.value)}
            className="w-[150px]"
          />
        </div>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Task Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Workers</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Share/Worker</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {searchQuery ||
                    filterType !== "all" ||
                    (dateRange.startDate && dateRange.endDate)
                      ? "No tasks match your filters"
                      : "No tasks recorded yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => {
                  const presentWorkers = task.workers.filter(
                    (w) => w.present
                  ).length;
                  const sharePerWorker =
                    presentWorkers > 0 ? task.taskAmount / presentWorkers : 0;

                  return (
                    <TableRow key={task._id}>
                      <TableCell>
                        <div className="font-medium">
                          #{task.order?._id.slice(-6).toUpperCase() || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {task.order?.client?.name || "Unknown Client"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTaskTypeColor(task.taskType)}>
                          {getTaskTypeLabel(task.taskType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(task.completedAt)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {presentWorkers} / {task.workers.length} present
                        </div>
                        <div className="text-xs text-gray-500">
                          {task.workers
                            .filter((w) => w.present)
                            .map((w) => w.worker.name)
                            .join(", ")}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(task.taskAmount)}</TableCell>
                      <TableCell>{formatCurrency(sharePerWorker)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTask(task)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTask(task._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Worker Task Modal */}
      {showTaskModal && (
        <WorkerTaskModal
          isOpen={showTaskModal}
          onClose={handleCloseTaskModal}
          order={selectedOrder}
          workers={workers}
          onSubmit={handleSubmitTask}
          existingTask={editingTask}
        />
      )}
    </div>
  );
};

export default WorkerTasksPage;
