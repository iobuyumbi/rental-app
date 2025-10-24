import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { workersAPI } from '../../services/api';
import StatusDateSelectionStep from './StatusDateSelectionStep';
import WorkerSelectionStep from './WorkerSelectionStep';

/**
 * Enhanced OrderStatusManager - Multi-step workflow for status changes
 * Based on advanced sample with improved UX and financial calculations
 */
const EnhancedOrderStatusManager = ({
    order,
    onStatusChange,
    onComplete,
    isOpen,
    onOpenChange
}) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Helper function to format date for HTML input
    const formatDateForInput = (dateValue) => {
        if (!dateValue) return new Date().toISOString().split('T')[0];
        if (typeof dateValue === 'string' && dateValue.includes('T')) {
            return dateValue.split('T')[0];
        }
        return dateValue;
    };

    const [statusData, setStatusData] = useState({
        status: '',
        actualDate: '',
        chargeableDays: 1,
    });
    
    const [calculations, setCalculations] = useState(null);
    const [selectedWorkers, setSelectedWorkers] = useState([]);
    const [availableWorkers, setAvailableWorkers] = useState([]);
    const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);

    // Status options based on current status
    const getAvailableStatuses = (currentStatus) => {
        const flow = (currentStatus || '').toLowerCase();
        const statusFlow = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'cancelled'],
            'completed': [], // Cannot change from completed
            'cancelled': [] // Cannot change from cancelled
        };
        return statusFlow[flow] || [];
    };

    const statusOptions = [
        { value: 'pending', label: 'Pending (Awaiting Confirmation)' },
        { value: 'confirmed', label: 'Confirmed (Ready for Pickup)' },
        { value: 'in_progress', label: 'In Progress (Items Rented Out)' },
        { value: 'completed', label: 'Completed (Items Returned)' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const availableStatuses = getAvailableStatuses(order?.status);

    // Initialize status data when modal opens
    useEffect(() => {
        if (isOpen && order) {
            const currentAvailableStatuses = getAvailableStatuses(order.status);
            const nextStatus = currentAvailableStatuses[0] || '';
            const initialActualDate = formatDateForInput(order.actualReturnDate || new Date());
            
            setStatusData({
                status: nextStatus,
                actualDate: initialActualDate,
                chargeableDays: order.chargeableDays || order.defaultChargeableDays || 1,
            });
            setStep(1);
        }
    }, [isOpen, order?._id]); // Only depend on isOpen and order ID to prevent infinite loops

    // Load workers from database
    const loadWorkersFromDatabase = useCallback(async () => {
        setIsLoadingWorkers(true);
        try {
            const response = await workersAPI.workers.get();
            const workersData = Array.isArray(response) ? response : response?.data || [];
            setAvailableWorkers(workersData);
            
            // Initialize selected workers based on workers already assigned to the order
            const assignedWorkerIds = new Set(order?.workers?.map(w => w._id) || []);
            const initialSelected = workersData
                .filter(w => assignedWorkerIds.has(w._id))
                .map(worker => ({ ...worker, present: true }));
            setSelectedWorkers(initialSelected);
        } catch (error) {
            console.error('Error loading workers:', error);
            toast.error('Failed to load workers');
        } finally {
            setIsLoadingWorkers(false);
        }
    }, [order?.workers]);

    useEffect(() => {
        if (isOpen) {
            loadWorkersFromDatabase();
        }
    }, [isOpen, loadWorkersFromDatabase]);

    // Enhanced calculation logic with early/late return handling
    const calculateAdjustedAmount = useCallback(() => {
        try {
            if (!order) return null;
            
            const startDate = new Date(order.rentalStartDate);
            const endDate = new Date(order.rentalEndDate);
            const actualDateObj = new Date(statusData.actualDate);
            
            // Calculate planned rental period
            const msInDay = 1000 * 60 * 60 * 24;
            const plannedPeriodDays = Math.ceil((endDate - startDate) / msInDay) + 1;
            
            // Determine the base chargeable days
            const defaultChargeableDays = order.defaultChargeableDays || order.chargeableDays || plannedPeriodDays;
            
            let calculatedDays = statusData.chargeableDays || defaultChargeableDays;
            let adjustedAmount = order.totalAmount;
            
            // Calculate the total planned charge based on the items and default days
            const fullAmount = order.orderItems?.reduce((sum, item) => {
                const quantity = item.quantityRented || item.quantity || 1;
                const unitPrice = item.unitPriceAtTimeOfRental || item.unitPrice || 0;
                return sum + (quantity * unitPrice * defaultChargeableDays);
            }, 0) || order.totalAmount;

            let dailyRate = fullAmount / defaultChargeableDays;
            if (dailyRate === 0 || isNaN(dailyRate)) dailyRate = fullAmount;
            
            // Apply pricing rules only if COMPLETED
            if (statusData.status === 'completed') {
                // If chargeableDays input is less than default, calculate actual usage
                if (!statusData.chargeableDays || statusData.chargeableDays === defaultChargeableDays) {
                    const actualUsageDays = Math.ceil((actualDateObj - startDate) / msInDay);
                    calculatedDays = Math.max(1, actualUsageDays);
                } else {
                    calculatedDays = statusData.chargeableDays;
                }
                
                adjustedAmount = fullAmount;
                
                if (calculatedDays < defaultChargeableDays) {
                    // Early return - minimum 50% charge
                    const minimumCharge = fullAmount * 0.5;
                    const calculatedCharge = calculatedDays * dailyRate;
                    adjustedAmount = Math.max(minimumCharge, calculatedCharge);
                } else if (calculatedDays > defaultChargeableDays) {
                    // Extended usage - charge extra at 150% rate
                    const extraDays = calculatedDays - defaultChargeableDays;
                    adjustedAmount = adjustedAmount + (extraDays * dailyRate * 1.5);
                }
            } else if (statusData.status === 'cancelled') {
                // Cancellation logic: 10% cancellation fee
                adjustedAmount = fullAmount * 0.10;
            }

            const difference = adjustedAmount - fullAmount;

            const results = {
                plannedPeriodDays,
                defaultChargeableDays,
                chargeableDays: calculatedDays,
                dailyRate: Math.round(dailyRate),
                originalAmount: fullAmount,
                adjustedAmount: Math.round(adjustedAmount),
                difference: Math.round(difference),
                isEarlyReturn: statusData.status === 'completed' && calculatedDays < defaultChargeableDays,
                isLateReturn: statusData.status === 'completed' && calculatedDays > defaultChargeableDays,
                actualDate: statusData.actualDate
            };
            
            setCalculations(results);
            return results;
        } catch (error) {
            console.error('Error calculating adjusted amount:', error);
            const fallback = {
                originalAmount: order?.totalAmount || 0,
                adjustedAmount: order?.totalAmount || 0,
                difference: 0,
                chargeableDays: statusData.chargeableDays || order?.defaultChargeableDays || 1,
            };
            setCalculations(fallback);
            return fallback;
        }
    }, [order, statusData]);

    useEffect(() => {
        if (order && statusData.status && statusData.actualDate) {
            calculateAdjustedAmount();
        }
    }, [statusData.status, statusData.chargeableDays, statusData.actualDate]); // Remove calculateAdjustedAmount from dependencies

    // Handle final status change submission
    const handleStatusChange = async () => {
        try {
            setLoading(true);
            const loadingToast = toast.loading('Updating order status...');
            
            // Final calculation before submit
            const finalCalculations = calculateAdjustedAmount();
            
            // Prepare final status data
            const finalStatusData = {
                status: statusData.status,
                actualDate: statusData.actualDate,
                chargeableDays: finalCalculations?.chargeableDays || statusData.chargeableDays,
                adjustedAmount: finalCalculations?.adjustedAmount || order.totalAmount,
                calculations: finalCalculations,
                workers: selectedWorkers
                    .filter(worker => worker.present)
                    .map(worker => ({
                        workerId: worker._id,
                        present: true
                    }))
            };

            // Call the parent's status change handler
            if (onStatusChange) {
                await onStatusChange(order._id, finalStatusData);
            }
            
            toast.dismiss(loadingToast);
            toast.success(`Order #${order._id.slice(-6).toUpperCase()} status updated to ${statusData.status.toUpperCase()}`);
            
            // Close the modal
            onComplete();

        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error(error.message || 'Failed to update order status');
        } finally {
            setLoading(false);
        }
    };

    // Worker management functions
    const addWorker = (worker) => {
        if (!selectedWorkers.some(w => w._id === worker._id)) {
            setSelectedWorkers([...selectedWorkers, { ...worker, present: true }]);
        }
    };

    const toggleWorkerPresence = (workerId) => {
        setSelectedWorkers(prev => prev.map(w => 
            w._id === workerId ? { ...w, present: !w.present } : w
        ));
    };

    // Render step content
    const renderStepContent = () => {
        switch(step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <p className="text-sm font-semibold text-gray-700">Step 1 of 2: Change Status & Set Date</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {/* Status selection */}
                            <div className="space-y-2">
                                <Label htmlFor="status">New Status</Label>
                                <Select
                                    value={statusData.status}
                                    onValueChange={(value) => setStatusData(prev => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select new status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableStatuses.map(status => {
                                            const option = statusOptions.find(opt => opt.value === status);
                                            return (
                                                <SelectItem key={status} value={status}>
                                                    {option?.label || status}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Actual Date selection */}
                            <div className="space-y-2">
                                <Label htmlFor="actualDate">Actual Date</Label>
                                <Input
                                    id="actualDate"
                                    type="date"
                                    value={statusData.actualDate}
                                    onChange={(e) => setStatusData(prev => ({ ...prev, actualDate: e.target.value }))}
                                    min={order?.rentalStartDate?.split('T')[0]}
                                    max={new Date().toISOString().split('T')[0]}
                                    required
                                />
                                <p className="text-xs text-gray-500">
                                    Rental Start: {new Date(order?.rentalStartDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Chargeable days (only for completed) */}
                        {statusData.status === 'completed' && (
                            <div className="space-y-2 p-3 border rounded-lg bg-yellow-50">
                                <Label htmlFor="chargeableDays" className="flex items-center text-yellow-800">
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Adjust Chargeable Days
                                </Label>
                                <Input
                                    id="chargeableDays"
                                    type="number"
                                    min="1"
                                    required
                                    value={statusData.chargeableDays}
                                    onChange={(e) => setStatusData(prev => ({ 
                                        ...prev, 
                                        chargeableDays: parseInt(e.target.value) || 1 
                                    }))}
                                />
                                <p className="text-sm text-yellow-700">
                                    Planned Days: <strong>{order?.defaultChargeableDays || 1}</strong>. 
                                    Actual Calculated Days: <strong>{calculations?.chargeableDays || 1}</strong>.
                                </p>
                                {calculations && (
                                    <p className="text-xs text-red-600">
                                        {calculations.isEarlyReturn
                                            ? `Early return detected! Minimum 50% charge applies. Adjusted amount is KES ${calculations.adjustedAmount.toLocaleString()}.` 
                                            : calculations.isLateReturn
                                                ? `Extended usage detected! Additional days charged at 150% rate. Adjusted amount is KES ${calculations.adjustedAmount.toLocaleString()}.` 
                                                : "Standard rental period is maintained."}
                                    </p>
                                )}
                            </div>
                        )}
                        
                        {statusData.status === 'cancelled' && (
                            <div className="bg-red-50 p-3 rounded-md text-sm text-red-700 font-medium">
                                <p>Order Cancellation: A 10% cancellation fee of <strong>KES {calculations?.adjustedAmount?.toLocaleString() || 0}</strong> will be applied.</p>
                            </div>
                        )}

                        {/* Price calculation summary */}
                        {calculations && (
                            <div className="bg-gray-100 p-4 rounded-lg space-y-1 text-sm border-l-4 border-indigo-500">
                                <p className="font-bold text-gray-800">
                                    Final Summary for <span className="uppercase">{statusData.status}</span>
                                </p>
                                <div className="grid grid-cols-2">
                                    <span className="text-gray-600">Initial Total:</span>
                                    <span className="text-right">KES {calculations.originalAmount.toLocaleString()}</span>
                                    
                                    <span className="text-gray-600 font-bold">Adjusted Total:</span>
                                    <span className="text-right font-extrabold text-lg text-indigo-700">
                                        KES {calculations.adjustedAmount.toLocaleString()}
                                    </span>
                                </div>
                                
                                {calculations.difference !== 0 && (
                                    <p className={`text-right pt-1 font-bold ${calculations.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {calculations.difference > 0 ? '+ Additional Charge' : '- Refund'}: 
                                        KES {Math.abs(calculations.difference).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="pt-4 flex justify-between">
                            <Button variant="outline" onClick={onComplete}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => setStep(2)}
                                disabled={!statusData.status || !statusData.actualDate}
                            >
                                Next: Select Workers
                            </Button>
                        </div>
                    </div>
                );

            case 2:
                const workersToAssign = availableWorkers
                    .filter(worker => !selectedWorkers.some(w => w._id === worker._id));
                    
                const isSubmitDisabled = selectedWorkers.filter(w => w.present).length === 0;

                return (
                    <div className="space-y-4">
                        <p className="text-sm font-semibold text-gray-700">Step 2 of 2: Assign Workers & Confirm</p>
                        
                        <div className="bg-gray-100 p-3 rounded-lg border-l-4 border-blue-500">
                             <p className="text-sm font-medium">
                                New Status: <span className="uppercase font-bold text-indigo-700">{statusData.status}</span>
                             </p>
                             <p className="text-sm font-medium">
                                Total: <span className="font-extrabold text-indigo-700">KES {calculations?.adjustedAmount?.toLocaleString() || 0}</span>
                             </p>
                        </div>

                        {/* Currently selected workers */}
                        <div className="space-y-3 max-h-60 overflow-y-auto border p-3 rounded-lg bg-white shadow-inner">
                            <h4 className="font-bold text-sm text-gray-800">Assigned Workers for this Task</h4>
                            {selectedWorkers.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No workers are currently assigned to this status change task.</p>
                            ) : (
                                selectedWorkers.map((worker, index) => (
                                    <div key={worker._id || index} className="flex items-center justify-between space-x-2 p-2 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`worker-${worker._id}`}
                                                checked={worker.present}
                                                onCheckedChange={() => toggleWorkerPresence(worker._id)}
                                            />
                                            <Label htmlFor={`worker-${worker._id}`} className="flex-1 cursor-pointer font-medium">
                                                {worker.name}
                                                <span className="text-xs ml-2 text-gray-500">({worker.role || 'Worker'})</span>
                                            </Label>
                                        </div>
                                        <Badge variant={worker.present ? 'default' : 'destructive'} className="text-[10px] h-4">
                                            {worker.present ? 'Present' : 'Absent'}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Available workers from database */}
                        <div className="space-y-3 max-h-48 overflow-y-auto border p-3 rounded-lg">
                            <h4 className="font-bold text-sm text-gray-800">Add Available Workers</h4>
                            {isLoadingWorkers ? (
                                <div className="flex items-center text-sm text-gray-500">
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                                    Loading workers...
                                </div>
                            ) : workersToAssign.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">All available workers are listed above.</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {workersToAssign.map(worker => (
                                        <Button
                                            key={worker._id}
                                            variant="outline"
                                            className="flex items-center justify-between p-2 text-left h-auto"
                                            onClick={() => addWorker(worker)}
                                        >
                                            <span className="truncate">{worker.name}</span>
                                            <PlusCircle className="h-4 w-4 ml-2 text-indigo-500" />
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                Back
                            </Button>
                            <Button
                                onClick={handleStatusChange}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors"
                                disabled={isSubmitDisabled || loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Confirm & Update Status
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!isOpen || !order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Update Order Status - #{order._id?.slice(-6).toUpperCase()}
                    </DialogTitle>
                    <DialogDescription>
                        Current Status: {order.status?.toUpperCase()}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {renderStepContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EnhancedOrderStatusManager;
