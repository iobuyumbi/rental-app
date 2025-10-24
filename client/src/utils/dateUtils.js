// client/src/components/orders/EnhancedOrderStatusManager/utils/dateUtils.js

/**
 * Date utility functions for rental calculations and formatting.
 */

/**
 * Calculate the number of chargeable days between start and end dates.
 * This function accounts for rental conventions, where same-day rental 
 * is 1 day, and multi-day rentals include both start and end days.
 * @param {string|Date} startDate - Rental start date.
 * @param {string|Date} endDate - Rental end date.
 * @param {number} minimumDays - Minimum days to charge (default: 1).
 * @returns {number} Number of chargeable days.
 */
export const calculateChargeableDays = (startDate, endDate, minimumDays = 1) => {
  if (!startDate || !endDate) return minimumDays;
  
  // Normalize to start of day for accurate day difference calculation
  const start = new Date(new Date(startDate).setHours(0, 0, 0, 0));
  const end = new Date(new Date(endDate).setHours(0, 0, 0, 0));
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return minimumDays;
  }
  
  // Calculate difference in milliseconds
  const timeDiff = end.getTime() - start.getTime();
  
  // Convert to days: Math.round for pure day differences.
  const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24));
  
  // If difference is 0 (same day), days = 1. Otherwise, days = diff + 1 (to include both dates).
  const chargeableDays = dayDiff === 0 ? 1 : dayDiff + 1;
  
  return Math.max(minimumDays, chargeableDays);
};

/**
 * Format date for display.
 * @param {string|Date} date - Date to format.
 * @param {string} format - Format type ('short', 'long', 'input').
 * @returns {string} Formatted date string.
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  switch (format) {
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'input':
      // Return YYYY-MM-DD format for HTML input fields using UTC to prevent timezone shifts
      const year = dateObj.getUTCFullYear();
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    case 'short':
    default:
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
  }
};

/**
 * Check if a return date is within acceptable terms (early, late, on-time).
 * @param {string|Date} actualReturnDate - Actual return date.
 * @param {string|Date} plannedReturnDate - Planned return date (rental end date).
 * @param {number} graceDays - Grace period in days (default: 1).
 * @returns {object} Return status information.
 */
export const analyzeReturnStatus = (actualReturnDate, plannedReturnDate, graceDays = 1) => {
  if (!actualReturnDate || !plannedReturnDate) {
    return {
      status: 'unknown',
      isEarly: false,
      isLate: false,
      isWithinGrace: false,
      extraDays: 0
    };
  }
  
  // Normalize dates to midnight to compare days only
  const normalize = (d) => new Date(new Date(d).setHours(0, 0, 0, 0));
  
  const actualDate = normalize(actualReturnDate);
  const plannedDate = normalize(plannedReturnDate);

  const graceEndDate = new Date(plannedDate);
  graceEndDate.setDate(graceEndDate.getDate() + graceDays);

  const isEarly = actualDate < plannedDate;
  const isLate = actualDate > graceEndDate;
  const isWithinGrace = actualDate >= plannedDate && actualDate <= graceEndDate;
  
  let extraDays = 0;
  if (isLate) {
    // Calculate difference from the day *after* the grace period ends
    extraDays = Math.ceil((actualDate - graceEndDate) / (1000 * 60 * 60 * 24));
  }
  
  let status = 'on-time';
  if (isEarly) status = 'early';
  else if (isLate) status = 'late';
  else if (isWithinGrace) status = 'grace-period';
  
  return {
    status,
    isEarly,
    isLate,
    isWithinGrace,
    extraDays,
    actualDate,
    plannedDate,
    graceEndDate
  };
};

/**
 * Calculate rental period summary.
 * @param {string|Date} startDate - Rental start date.
 * @param {string|Date} endDate - Rental end date.
 * @returns {object} Rental period information.
 */
export const calculateRentalPeriod = (startDate, endDate) => {
  const chargeableDays = calculateChargeableDays(startDate, endDate);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return {
    startDate: start,
    endDate: end,
    chargeableDays,
    totalDays: chargeableDays,
    formattedPeriod: `${formatDate(start)} - ${formatDate(end)}`,
    duration: chargeableDays === 1 ? '1 day' : `${chargeableDays} days`
  };
};

/**
 * Formats a date string to the YYYY-MM-DD format suitable for HTML input fields.
 * This function simply calls formatDate with the 'input' format.
 * @param {string|Date} dateValue - The date string or Date object.
 * @returns {string} The formatted date string (e.g., '2025-10-21').
 */
export const formatDateForInput = (dateValue) => {
  // Rely on the robust 'input' case within formatDate
  return formatDate(dateValue, 'input');
};
