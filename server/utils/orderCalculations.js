/**
 * Order calculation utilities for backend
 */

/**
 * Calculate the number of chargeable days between start and end dates
 * @param {Date|string} startDate - Rental start date
 * @param {Date|string} endDate - Rental end date
 * @param {number} minimumDays - Minimum days to charge (default: 1)
 * @returns {number} Number of chargeable days
 */
const calculateChargeableDays = (startDate, endDate, minimumDays = 1) => {
  if (!startDate || !endDate) return minimumDays;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return minimumDays;
  }
  
  // Calculate difference in milliseconds
  const timeDiff = end.getTime() - start.getTime();
  
  // Convert to days, ensuring at least minimum days is charged
  const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  // For rental business: if same day rental, charge 1 day minimum
  // If multi-day rental, include both start and end days
  const chargeableDays = dayDiff === 0 ? 1 : dayDiff + 1;
  
  return Math.max(minimumDays, chargeableDays);
};

/**
 * Calculate order totals including subtotal, discount, tax, and final total
 * @param {Array} items - Array of order items with product info
 * @param {Date|string} startDate - Rental start date
 * @param {Date|string} endDate - Rental end date
 * @param {number} discountPercentage - Discount percentage (0-100)
 * @param {number} taxRate - Tax rate percentage (default: 16 for Kenya VAT)
 * @returns {Object} Calculation breakdown
 */
const calculateOrderTotals = (items, startDate, endDate, discountPercentage = 0, taxRate = 16) => {
  if (!items || items.length === 0) {
    return {
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      chargeableDays: 1
    };
  }
  
  const chargeableDays = calculateChargeableDays(startDate, endDate, 1);
  
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const quantity = parseFloat(item.quantity || item.quantityRented || 0);
    const unitPrice = parseFloat(item.unitPrice || item.unitPriceAtTimeOfRental || 0);
    const itemDays = item.daysUsed || chargeableDays;
    return sum + (quantity * unitPrice * itemDays);
  }, 0);
  
  // Calculate discount amount
  const discountAmount = (subtotal * (parseFloat(discountPercentage) || 0)) / 100;
  
  // Calculate tax on discounted amount
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * (parseFloat(taxRate) || 0)) / 100;
  
  // Calculate final total
  const totalAmount = subtotal - discountAmount + taxAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimal places
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    chargeableDays
  };
};

/**
 * Calculate financial impact of status changes (early return, late return, etc.)
 * @param {Object} order - Original order object
 * @param {Date|string} actualReturnDate - Actual return date
 * @param {number} graceDays - Grace period in days (default: 1)
 * @returns {Object} Financial impact analysis
 */
const calculateStatusChangeImpact = (order, actualReturnDate, graceDays = 1) => {
  if (!order || !actualReturnDate) {
    return {
      adjustmentNeeded: false,
      adjustmentAmount: 0,
      adjustmentReason: 'No adjustment needed',
      originalAmount: order?.totalAmount || 0,
      adjustedAmount: order?.totalAmount || 0
    };
  }
  
  const plannedEndDate = new Date(order.rentalEndDate);
  const actualEndDate = new Date(actualReturnDate);
  const graceEndDate = new Date(plannedEndDate);
  graceEndDate.setDate(graceEndDate.getDate() + graceDays);
  
  const originalAmount = order.totalAmount || 0;
  let adjustedAmount = originalAmount;
  let adjustmentReason = 'No adjustment needed';
  let adjustmentNeeded = false;
  
  const isEarlyReturn = actualEndDate < plannedEndDate;
  const isLateReturn = actualEndDate > graceEndDate;
  
  if (isEarlyReturn) {
    // Early return - potential refund calculation
    const originalDays = calculateChargeableDays(order.rentalStartDate, order.rentalEndDate);
    const actualDays = calculateChargeableDays(order.rentalStartDate, actualReturnDate);
    const dailyRate = originalDays > 0 ? originalAmount / originalDays : 0;
    
    // Apply minimum 50% charge policy for early returns
    adjustedAmount = Math.max(dailyRate * actualDays, originalAmount * 0.5);
    adjustmentReason = `Early return - adjusted for ${actualDays} actual days used`;
    adjustmentNeeded = true;
  } else if (isLateReturn) {
    // Late return - penalty calculation
    const extraDays = Math.ceil((actualEndDate - graceEndDate) / (1000 * 60 * 60 * 24));
    const originalDays = calculateChargeableDays(order.rentalStartDate, order.rentalEndDate);
    const dailyRate = originalDays > 0 ? originalAmount / originalDays : 0;
    const penaltyRate = dailyRate * 1.5; // 50% penalty for late returns
    
    adjustedAmount = originalAmount + (extraDays * penaltyRate);
    adjustmentReason = `Late return - ${extraDays} day(s) penalty applied`;
    adjustmentNeeded = true;
  }
  
  return {
    adjustmentNeeded,
    adjustmentAmount: adjustedAmount - originalAmount,
    adjustmentReason,
    originalAmount,
    adjustedAmount: Math.round(adjustedAmount * 100) / 100,
    isEarlyReturn,
    isLateReturn
  };
};

/**
 * Validate order calculation data
 * @param {Object} orderData - Order data to validate
 * @returns {Object} Validation result
 */
const validateOrderCalculation = (orderData) => {
  const errors = [];
  
  if (!orderData.rentalStartDate) {
    errors.push('Rental start date is required');
  }
  
  if (!orderData.rentalEndDate) {
    errors.push('Rental end date is required');
  }
  
  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('At least one item is required');
  }
  
  // Validate dates
  if (orderData.rentalStartDate && orderData.rentalEndDate) {
    const startDate = new Date(orderData.rentalStartDate);
    const endDate = new Date(orderData.rentalEndDate);
    
    if (isNaN(startDate.getTime())) {
      errors.push('Invalid rental start date');
    }
    
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid rental end date');
    }
    
    if (startDate >= endDate) {
      errors.push('Rental end date must be after start date');
    }
  }
  
  // Validate items
  if (orderData.items && Array.isArray(orderData.items)) {
    orderData.items.forEach((item, index) => {
      if (!item.productId && !item.product) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      
      if (!item.quantity && !item.quantityRented) {
        errors.push(`Item ${index + 1}: Quantity is required`);
      }
      
      const quantity = parseFloat(item.quantity || item.quantityRented || 0);
      if (quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  calculateChargeableDays,
  calculateOrderTotals,
  calculateStatusChangeImpact,
  validateOrderCalculation
};
