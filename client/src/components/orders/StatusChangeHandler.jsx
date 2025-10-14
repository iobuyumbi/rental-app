import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import WorkerTaskRecorder from '../workers/WorkerTaskRecorder';
import DateValidationHandler from './DateValidationHandler';
import { calculateSuggestedAmount } from '../../utils/workerTaskUtils';
import { smsAPI } from '../../services/smsAPI';

/**
 * StatusChangeHandler - Automatically handles worker task recording when order status changes
 * Specifically triggers when status changes to 'in_progress' (items rented out)
 */
const StatusChangeHandler = ({ 
  order, 
  previousStatus, 
  newStatus, 
  workers = [], 
  onTaskCreated,
  onComplete,
  onOrderUpdate // New prop to handle order updates with adjusted amounts
}) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDateValidation, setShowDateValidation] = useState(false);
  const [taskData, setTaskData] = useState(null);
  const [dateValidationResult, setDateValidationResult] = useState(null);

  useEffect(() => {
    // Check if status changed to 'in_progress' from any other status
    if (newStatus === 'in_progress' && previousStatus !== 'in_progress') {
      handleStatusChangeToInProgress();
    }
    // Check if status changed to 'completed' from 'in_progress' 
    else if (newStatus === 'completed' && previousStatus === 'in_progress') {
      handleStatusChangeToCompleted();
    }
  }, [newStatus, previousStatus]);

  const handleStatusChangeToInProgress = async () => {
    // Server automatically handles inventory reduction, so proceed directly to worker task recording
    const suggestedAmount = calculateTaskAmount(order.items || [], 'issuing');
    
    const issuingTaskData = {
      order: order._id,
      taskType: 'issuing',
      taskAmount: suggestedAmount,
      notes: `Items issued for order #${order._id?.slice(-6).toUpperCase()}. Status changed to In Progress.`,
      workers: workers.map(worker => ({
        worker: worker._id,
        present: false
      }))
    };

    setTaskData(issuingTaskData);
    setShowTaskModal(true);
    
    // Send SMS notification for order confirmation
    await sendSMSNotification('confirmation');
    
    toast.success('Order status updated. Please record workers who issued the items.');
  };

  const handleStatusChangeToCompleted = () => {
    // First show date validation to check return dates and calculate adjustments
    setShowDateValidation(true);
    toast.info('Order completed. Please validate return date and usage calculation.');
  };

  const handleDateValidationComplete = async (validationResult) => {
    setDateValidationResult(validationResult);
    setShowDateValidation(false);

    try {
      // Server automatically handles inventory restoration, so focus on order amount updates
      if (validationResult.requiresAdjustment && onOrderUpdate) {
        await onOrderUpdate(order._id, {
          totalAmount: validationResult.adjustedAmount,
          actualReturnDate: validationResult.actualReturnDate,
          usageCalculation: validationResult.calculations
        });
        
        if (validationResult.calculations.isEarlyReturn) {
          toast.success(`Order completed. Amount adjusted with refund of KES ${validationResult.calculations.refundAmount.toLocaleString()}.`);
        } else if (validationResult.calculations.isLateReturn) {
          toast.warning(`Order completed. Late return penalty of KES ${validationResult.calculations.penaltyAmount.toLocaleString()} applied.`);
        }
      } else {
        toast.success('Order completed successfully.');
      }
    } catch (error) {
      console.error('Error updating order amount:', error);
      toast.error('Failed to update order amount');
    }

    // Now proceed with worker task recording
    const suggestedAmount = calculateTaskAmount(order.items || [], 'receiving');
    
    const receivingTaskData = {
      order: order._id,
      taskType: 'receiving',
      taskAmount: suggestedAmount,
      notes: `Items received back for order #${order._id?.slice(-6).toUpperCase()}. Returned on ${validationResult.actualReturnDate}.`,
      workers: workers.map(worker => ({
        worker: worker._id,
        present: false
      }))
    };

    setTaskData(receivingTaskData);
    setShowTaskModal(true);
  };

  const handleDateValidationCancel = () => {
    setShowDateValidation(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleTaskSubmit = async (submittedTaskData) => {
    try {
      if (onTaskCreated) {
        await onTaskCreated(submittedTaskData);
      }
      
      setShowTaskModal(false);
      setTaskData(null);
      
      // Send completion SMS if this was a receiving task (order completed)
      if (submittedTaskData.taskType === 'receiving') {
        await sendSMSNotification('completion');
      }
      
      toast.success('Worker task recorded for status change');
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error recording task for status change:', error);
      throw error; // Let WorkerTaskModal handle the error display
    }
  };

  const handleCloseModal = () => {
    setShowTaskModal(false);
    setTaskData(null);
    
    // Still call onComplete even if user cancels
    if (onComplete) {
      onComplete();
    }
  };

  // SMS notification handler
  const sendSMSNotification = async (type) => {
    try {
      if (!order.client?.phone) {
        console.warn('No phone number available for SMS notification');
        return;
      }

      let result;
      switch (type) {
        case 'confirmation':
          result = await smsAPI.sendOrderConfirmation(order._id);
          toast.success('Order confirmation SMS sent to client');
          break;
        case 'reminder':
          result = await smsAPI.sendRentalReminder(order._id);
          toast.success('Rental reminder SMS sent to client');
          break;
        case 'completion':
          // Send completion notification
          const message = `Thank you! Your rental order #${order._id.slice(-6)} has been completed. Items returned successfully. We appreciate your business!`;
          result = await smsAPI.sendSMS({
            phoneNumber: order.client.phone,
            message
          });
          toast.success('Order completion SMS sent to client');
          break;
        default:
          console.warn('Unknown SMS notification type:', type);
      }
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      // Don't show error toast to avoid disrupting the main workflow
    }
  };

  // Dynamic modal content based on task type
  const getModalContent = () => {
    if (!taskData) return {};
    
    switch (taskData.taskType) {
      case 'issuing':
        return {
          title: 'Record Issuing Task - Items Rented Out',
          subtitle: 'Order status changed to In Progress. Please record which workers issued the items to the client.',
          label: 'Record Issuing Workers'
        };
      case 'receiving':
        return {
          title: 'Record Receiving Task - Items Returned',
          subtitle: 'Order status changed to Completed. Please record which workers received the returned items.',
          label: 'Record Receiving Workers'
        };
      default:
        return {
          title: 'Record Worker Task - Status Change',
          subtitle: 'Order status changed. Please record which workers were involved.',
          label: 'Record Task'
        };
    }
  };

  const modalContent = getModalContent();

  return (
    <>
      {/* Date Validation Modal - Shows first when completing order */}
      <DateValidationHandler
        isOpen={showDateValidation}
        order={order}
        onValidationComplete={handleDateValidationComplete}
        onCancel={handleDateValidationCancel}
      />

      {/* Worker Task Modal - Shows after date validation */}
      {showTaskModal && taskData && (
        <WorkerTaskRecorder
          isOpen={showTaskModal}
          onClose={handleCloseModal}
          order={order}
          workers={workers}
          onSubmit={handleTaskSubmit}
          taskTypePreset={{
            type: taskData.taskType,
            label: modalContent.label,
            suggestedAmount: taskData.taskAmount,
            description: taskData.notes
          }}
          title={modalContent.title}
          subtitle={modalContent.subtitle}
        />
      )}
    </>
  );
};

export default StatusChangeHandler;
