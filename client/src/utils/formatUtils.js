/**
 * Utility functions for formatting dates, currency, and other data using modern Intl APIs
 * for localization and consistency.
 */

/**
 * Format a date string or Date object to a localized date string
 * @param {string|Date} date - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    // Default options for a readable date format
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a date to include time (e.g., Oct 21, 2025, 12:10 PM)
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a number as currency (KES by default)
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: KES)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'KES') => {
  if (amount === null || amount === undefined) return `${currency} 0.00`;
  
  try {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return `${currency} 0.00`;
    
    return new Intl.NumberFormat('en-KE', { // Using 'en-KE' locale for KES currency formatting
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currency} ${amount}`; // Fallback
  }
};

/**
 * Format a number with thousand separators
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  
  try {
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    
    if (isNaN(numValue)) return '0';
    
    return new Intl.NumberFormat('en-US').format(numValue);
  } catch (error) {
    console.error('Error formatting number:', error);
    return String(num);
  }
};

/**
 * Format a percentage
 * @param {number} value - The value to format as percentage (e.g., 25 for 25%)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  
  try {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) return '0%';
    
    // Using simple toFixed for percentage formatting as Intl.NumberFormat('percent')
    // expects input from 0 to 1 (e.g., 0.25).
    return `${numValue.toFixed(decimals)}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return `${value}%`;
  }
};

/**
 * Truncate text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length (default: 50)
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format a phone number, specifically designed for Kenyan (+254) numbers.
 * @param {string} phone - The phone number to format (e.g., "254701234567" or "0701234567")
 * @returns {string} Formatted phone number (e.g., "+254 701 234 567")
 */
export const formatPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +254 XXX XXX XXX for Kenyan numbers (12 digits including 254)
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    // E.g., 254 701 234 567
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  // Format as 0XXX XXX XXX for local numbers (10 digits starting with 0)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    // E.g., 0701 234 567
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  // Return the original input if it doesn't match expected formats
  return phone;
};
