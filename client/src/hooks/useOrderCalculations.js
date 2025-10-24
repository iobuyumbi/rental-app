import { useMemo } from 'react';
// Assuming `calculateChargeableDays` lives in a general utility folder
import { calculateChargeableDays } from '../utils/dateUtils'; 

/**
 * Calculates the adjusted total amount and related metrics for an order 
 * based on its status, actual return date, and associated rules (early/late return fees).
 * The results are memoized to optimize performance.
 * * @param {Object} order - The original order object.
 * @param {Object} statusData - Data related to the order's completion status.
 * @returns {Object|null} Calculation results or null.
 */
export const useOrderCalculations = (order, statusData) => {
  
  // Use useMemo to ensure calculations only run when input props change
  return useMemo(() => {
    if (!order || !statusData.status || !statusData.actualDate) return null;

    try {
      const startDate = new Date(order.rentalStartDate);
      const plannedEndDate = new Date(order.rentalEndDate);
      const actualEndDate = new Date(statusData.actualDate);
        
      // Critical: Ensure all dates are valid before proceeding
      if (isNaN(startDate) || isNaN(plannedEndDate) || isNaN(actualEndDate)) {
          throw new Error("Invalid date provided in order or status data.");
      }

      const plannedDays = calculateChargeableDays(startDate, plannedEndDate);
      const actualDays = calculateChargeableDays(startDate, actualEndDate);
      const defaultChargeableDays = order.defaultChargeableDays || plannedDays;

      const dailyRate = (order.totalAmount || 0) / Math.max(1, plannedDays);
      let adjustedAmount = order.totalAmount;
      let calculatedDays = statusData.chargeableDays || defaultChargeableDays;

      if (statusData.status === 'completed') {
        if (!statusData.chargeableDays) {
          calculatedDays = Math.max(1, actualDays);
        }

        if (calculatedDays < defaultChargeableDays) {
          // Early return: minimum 50% charge or calculated charge
          const minCharge = order.totalAmount * 0.5;
          const calculatedCharge = calculatedDays * dailyRate;
          adjustedAmount = Math.max(minCharge, calculatedCharge);
        } else if (calculatedDays > defaultChargeableDays) {
          // Late return: 150% rate for extra days
          const extraDays = calculatedDays - defaultChargeableDays;
          adjustedAmount += extraDays * dailyRate * 1.5;
        }
      } else if (statusData.status === 'cancelled') {
        // 10% cancellation fee
        adjustedAmount = order.totalAmount * 0.1;
        calculatedDays = 0;
      }

      // Final object is consistently returned
      return {
        plannedDays,
        actualDays,
        calculatedDays,
        dailyRate,
        originalAmount: order.totalAmount,
        // Final rounding for financial accuracy
        adjustedAmount: Math.round(adjustedAmount * 100) / 100,
        difference: Math.round((adjustedAmount - order.totalAmount) * 100) / 100,
        isEarlyReturn: statusData.status === 'completed' && calculatedDays < defaultChargeableDays,
        isLateReturn: statusData.status === 'completed' && calculatedDays > defaultChargeableDays,
      };
    } catch (error) {
      console.error('Error in order calculations:', error);
      return {
        originalAmount: order?.totalAmount || 0,
        adjustedAmount: order?.totalAmount || 0,
        difference: 0,
        calculatedDays: statusData.chargeableDays || order?.defaultChargeableDays || 1,
        error: error.message,
        // Added a flag for easy component checking
        hasCalculationError: true, 
      };
    }
  }, [order, statusData]); // Dependencies for memoization

};
