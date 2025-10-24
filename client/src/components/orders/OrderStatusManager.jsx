import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { AlertTriangle, Check, Loader2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { workersAPI } from '../../services/api';

const OrderStatusManager = ({ 
    order, 
    onStatusChange, // Callback to update the main App's state 
    onComplete, // Close modal handler
    isOpen,
    onOpenChange
}) => {
    const [step, setStep] = useState(1);
    
    // Helper function to format date for HTML input 
    const formatDateForInput = (dateValue) => { 
        if (!dateValue) return new Date().toISOString().split('T')[0]; 
        if (typeof dateValue === 'string' && dateValue.includes('T')) { 
            return dateValue.split('T')[0]; // Convert ISO string to yyyy-MM-dd 
        } 
        return dateValue; 
    }; 

    const initialActualDate = formatDateForInput(order?.actualReturnDate || new Date());

    const [statusData, setStatusData] = useState({ 
        status: order?.nextStatus || getAvailableStatuses(order?.orderStatus || 'pending')[0] || '', 
        actualDate: initialActualDate, 
        chargeableDays: order?.defaultChargeableDays || 1, 
    });
    const [calculations, setCalculations] = useState(null);
    const [selectedWorkers, setSelectedWorkers] = useState([]);
    const [availableWorkers, setAvailableWorkers] = useState([]);
    const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);

    // Status options based on current status 
    function getAvailableStatuses(currentStatus) { 
        const flow = (currentStatus || '').toLowerCase(); 
        const statusFlow = { 
            'pending': ['confirmed', 'cancelled'], 
            'confirmed': ['in_progress', 'cancelled'], 
            'in_progress': ['completed', 'cancelled'], 
            'completed': [], // Cannot change from completed 
            'cancelled': [] // Cannot change from cancelled 
        }; 
        return statusFlow[flow] || []; 
    }

    const statusOptions = [ 
        { value: 'pending', label: 'Pending (Awaiting Confirmation)' }, 
        { value: 'confirmed', label: 'Confirmed (Ready for Pickup)' }, 
        { value: 'in_progress', label: 'In Progress (Items Rented Out)' }, 
        { value: 'completed', label: 'Completed (Items Returned)' }, 
        { value: 'cancelled', label: 'Cancelled' } 
    ]; 

    const availableStatuses = getAvailableStatuses(order?.orderStatus);

    // Load workers from database 
    const loadWorkersFromDatabase = useCallback(async () => { 
        setIsLoadingWorkers(true); 
        try { 
            const response = await workersAPI.workers.get(); 
            if (response && response.data) { 
                setAvailableWorkers(response.data); 
                
                // Initialize selected workers based on workers already assigned to the order 
                const assignedWorkerIds = new Set(order?.workers?.map(w => w._id) || []); 
                const initialSelected = response.data 
                    .filter(w => assignedWorkerIds.has(w._id)) 
                    .map(worker => ({ ...worker, present: true })); 
                setSelectedWorkers(initialSelected); 
            } 
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
            // Reset state when modal opens
            setStep(1);
            setStatusData({
                status: order?.nextStatus || getAvailableStatuses(order?.orderStatus || 'pending')[0] || '', 
                actualDate: initialActualDate, 
                chargeableDays: order?.defaultChargeableDays || 1,
            });
        }
    }, [isOpen, loadWorkersFromDatabase, initialActualDate, order]);

    // Calculate adjusted amount based on status data
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
            const defaultChargeableDays = order.defaultChargeableDays || plannedPeriodDays;
            
            let calculatedDays = statusData.chargeableDays || defaultChargeableDays;
            let adjustedAmount = order.totalAmount;
            
            // Calculate the total planned charge based on the items and default days
            const fullAmount = order.items?.reduce((sum, item) => {
                const quantity = item.quantity || 1;
                const unitPrice = item.unitPrice || 0;
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
                    const actualCharge = calculatedDays * dailyRate;
                    adjustedAmount = Math.max(minimumCharge, actualCharge);
                } else if (calculatedDays > defaultChargeableDays) {
                    // Late return - additional charges
                    const extraDays = calculatedDays - defaultChargeableDays;
                    const extraCharge = extraDays * dailyRate * 1.5; // 50% more for late days
                    adjustedAmount = fullAmount + extraCharge;
                }
            }
            
            return {
                plannedDays: plannedPeriodDays,
                defaultChargeableDays,
                calculatedDays,
                fullAmount,
                adjustedAmount,
                dailyRate,
                difference: adjustedAmount - fullAmount
            };
        } catch (error) {
            console.error('Error calculating adjusted amount:', error);
            return null;
        }
    }, [order, statusData]);

    // Update calculations when status data changes
    useEffect(() => {
        if (statusData.status === 'completed') {
            const newCalculations = calculateAdjustedAmount();
            setCalculations(newCalculations);
        } else {
            setCalculations(null);
        }
    }, [statusData, calculateAdjustedAmount]);

    const handleStatusChange = (value) => {
        setStatusData(prev => ({ ...prev, status: value }));
    };

    const handleDateChange = (e) => {
        setStatusData(prev => ({ ...prev, actualDate: e.target.value }));
    };

    const handleDaysChange = (e) => {
        setStatusData(prev => ({ ...prev, chargeableDays: parseInt(e.target.value, 10) }));
    };

    const handleWorkerSelection = (workerId, isSelected) => {
        setSelectedWorkers(prev => {
            if (isSelected) {
                const worker = availableWorkers.find(w => w._id === workerId);
                if (worker && !prev.some(w => w._id === workerId)) {
                    return [...prev, { ...worker, present: true }];
                }
            } else {
                return prev.filter(w => w._id !== workerId);
            }
            return prev;
        });
    };

    const handleWorkerPresence = (workerId, isPresent) => {
        setSelectedWorkers(prev => 
            prev.map(w => w._id === workerId ? { ...w, present: isPresent } : w)
        );
    };

    const handleSubmit = () => {
        // Prepare data for submission
        const updateData = {
            status: statusData.status,
            workers: selectedWorkers.map(w => ({
                workerId: w._id,
                present: w.present
            }))
        };

        // Add completion data if status is completed
        if (statusData.status === 'completed') {
            updateData.actualReturnDate = statusData.actualDate;
            updateData.chargeableDays = statusData.chargeableDays;
            if (calculations) {
                updateData.adjustedAmount = calculations.adjustedAmount;
            }
        }

        // Call the onStatusChange callback with the order ID and update data
        if (onStatusChange) {
            onStatusChange(order._id, updateData);
        }

        // Close the modal
        if (onComplete) {
            onComplete();
        }
    };

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => Math.max(1, prev - 1));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Update Order Status</DialogTitle>
                    <DialogDescription>
                        Change the status of this order and manage associated tasks.
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">New Status</Label>
                            <Select 
                                value={statusData.status} 
                                onValueChange={handleStatusChange}
                                disabled={availableStatuses.length === 0}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions
                                        .filter(option => availableStatuses.includes(option.value))
                                        .map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                            {availableStatuses.length === 0 && (
                                <p className="text-sm text-amber-600">
                                    This order cannot be updated from its current status.
                                </p>
                            )}
                        </div>

                        {statusData.status === 'completed' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="actualDate">Actual Return Date</Label>
                                    <Input
                                        id="actualDate"
                                        type="date"
                                        value={statusData.actualDate}
                                        onChange={handleDateChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="chargeableDays">Chargeable Days</Label>
                                    <Input
                                        id="chargeableDays"
                                        type="number"
                                        min="1"
                                        value={statusData.chargeableDays}
                                        onChange={handleDaysChange}
                                    />
                                </div>
                                {calculations && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
                                        <h4 className="font-medium mb-2">Price Calculation</h4>
                                        <div className="space-y-1">
                                            <p>Planned days: {calculations.plannedDays}</p>
                                            <p>Calculated days: {calculations.calculatedDays}</p>
                                            <p>Original amount: KES {calculations.fullAmount.toLocaleString()}</p>
                                            <p className="font-medium">
                                                Adjusted amount: KES {calculations.adjustedAmount.toLocaleString()}
                                                {calculations.difference !== 0 && (
                                                    <span className={calculations.difference > 0 ? "text-red-600" : "text-green-600"}>
                                                        {" "}({calculations.difference > 0 ? "+" : ""}{calculations.difference.toLocaleString()})
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onComplete}
                            >
                                Cancel
                            </Button>
                            {statusData.status === 'in_progress' ? (
                                <Button type="button" onClick={handleNext}>
                                    Next: Assign Workers
                                </Button>
                            ) : (
                                <Button 
                                    type="button" 
                                    onClick={handleSubmit}
                                    disabled={availableStatuses.length === 0 || !statusData.status}
                                >
                                    Update Status
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium mb-2">Assign Workers to this Order</h3>
                            {isLoadingWorkers ? (
                                <p className="text-sm text-gray-500">Loading workers...</p>
                            ) : (
                                <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-2">
                                    {availableWorkers.length === 0 ? (
                                        <p className="text-sm text-gray-500">No workers available</p>
                                    ) : (
                                        availableWorkers.map(worker => {
                                            const isSelected = selectedWorkers.some(w => w._id === worker._id);
                                            return (
                                                <div key={worker._id} className="flex items-center space-x-2 p-2 border-b last:border-b-0">
                                                    <Checkbox 
                                                        id={`worker-${worker._id}`}
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) => handleWorkerSelection(worker._id, checked)}
                                                    />
                                                    <Label htmlFor={`worker-${worker._id}`} className="flex-1">
                                                        {worker.name}
                                                    </Label>
                                                    {isSelected && (
                                                        <div className="flex items-center space-x-2">
                                                            <Label htmlFor={`present-${worker._id}`} className="text-xs">Present</Label>
                                                            <Checkbox 
                                                                id={`present-${worker._id}`}
                                                                checked={selectedWorkers.find(w => w._id === worker._id)?.present}
                                                                onCheckedChange={(checked) => handleWorkerPresence(worker._id, checked)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                            >
                                Back
                            </Button>
                            <Button 
                                type="button" 
                                onClick={handleSubmit}
                            >
                                Update Status
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default OrderStatusManager;