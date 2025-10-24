/**
 * Error handling utilities for the rental app
 * Provides consistent error handling and user feedback across components
 */

import { toast } from 'sonner';

/**
 * Standard error types for the rental app
 */
export const ERROR_TYPES = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  SERVER: 'server',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  UNKNOWN: 'unknown'
};

/**
 * Parse and categorize errors from API responses
 * @param {Error} error - The error object
 * @returns {Object} Parsed error information
 */
export const parseError = (error) => {
  let type = ERROR_TYPES.UNKNOWN;
  let message = 'An unexpected error occurred';
  let details = null;
  let statusCode = null;

  if (error.response) {
    // Server responded with error status
    statusCode = error.response.status;
    const responseData = error.response.data;

    switch (statusCode) {
      case 400:
        type = ERROR_TYPES.VALIDATION;
        message = responseData?.message || responseData?.error || 'Invalid request data';
        details = responseData?.details || responseData?.errors;
        break;
      case 401:
        type = ERROR_TYPES.AUTHENTICATION;
        message = 'Authentication required. Please log in again.';
        break;
      case 403:
        type = ERROR_TYPES.AUTHORIZATION;
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        type = ERROR_TYPES.NOT_FOUND;
        message = responseData?.message || 'Resource not found';
        break;
      case 409:
        type = ERROR_TYPES.CONFLICT;
        message = responseData?.message || 'Conflict with existing data';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        type = ERROR_TYPES.SERVER;
        message = 'Server error. Please try again later.';
        break;
      default:
        message = responseData?.message || `Server error: ${statusCode}`;
    }
  } else if (error.request) {
    // Request made but no response received
    type = ERROR_TYPES.NETWORK;
    message = 'Network error. Please check your connection and try again.';
  } else {
    // Something else happened
    message = error.message || 'An unexpected error occurred';
  }

  return {
    type,
    message,
    details,
    statusCode,
    originalError: error
  };
};

/**
 * Handle errors with appropriate user feedback
 * @param {Error} error - The error object
 * @param {Object} options - Options for error handling
 * @returns {Object} Parsed error information
 */
export const handleError = (error, options = {}) => {
  const {
    showToast = true,
    context = '',
    fallbackMessage = null,
    onAuthError = null,
    onNetworkError = null
  } = options;

  const parsedError = parseError(error);
  
  // Use fallback message if provided
  if (fallbackMessage) {
    parsedError.message = fallbackMessage;
  }

  // Add context to message if provided
  const contextualMessage = context 
    ? `${context}: ${parsedError.message}` 
    : parsedError.message;

  // Show toast notification if enabled
  if (showToast) {
    switch (parsedError.type) {
      case ERROR_TYPES.VALIDATION:
        toast.error(contextualMessage, {
          description: Array.isArray(parsedError.details) 
            ? parsedError.details.join(', ') 
            : parsedError.details
        });
        break;
      case ERROR_TYPES.AUTHENTICATION:
        toast.error(contextualMessage);
        if (onAuthError) onAuthError(parsedError);
        break;
      case ERROR_TYPES.NETWORK:
        toast.error(contextualMessage);
        if (onNetworkError) onNetworkError(parsedError);
        break;
      case ERROR_TYPES.SERVER:
        toast.error(contextualMessage, {
          description: 'If the problem persists, please contact support.'
        });
        break;
      default:
        toast.error(contextualMessage);
    }
  }

  console.error(`Error [${parsedError.type}]:`, error);
  
  return parsedError;
};

/**
 * Validation error handler for forms
 * @param {Object} errors - Validation errors object
 * @param {Function} setErrors - Function to set form errors
 * @param {Object} options - Options for error handling
 */
export const handleValidationErrors = (errors, setErrors, options = {}) => {
  const { showToast = true, context = 'Validation failed' } = options;

  if (typeof errors === 'object' && errors !== null) {
    setErrors(errors);
    
    if (showToast) {
      const errorMessages = Object.values(errors).filter(Boolean);
      if (errorMessages.length > 0) {
        toast.error(context, {
          description: errorMessages.join(', ')
        });
      }
    }
  } else if (typeof errors === 'string') {
    if (showToast) {
      toast.error(errors);
    }
  }
};

/**
 * Async operation wrapper with error handling
 * @param {Function} operation - Async operation to execute
 * @param {Object} options - Options for error handling
 * @returns {Promise} Result of the operation or null if error
 */
export const withErrorHandling = async (operation, options = {}) => {
  const {
    context = '',
    showToast = true,
    fallbackMessage = null,
    onError = null,
    onSuccess = null
  } = options;

  try {
    const result = await operation();
    if (onSuccess) onSuccess(result);
    return result;
  } catch (error) {
    const parsedError = handleError(error, {
      showToast,
      context,
      fallbackMessage
    });
    
    if (onError) onError(parsedError);
    return null;
  }
};

/**
 * Create a standardized error boundary for React components
 * @param {string} componentName - Name of the component for error context
 * @returns {Object} Error boundary methods
 */
export const createErrorBoundary = (componentName) => {
  return {
    handleError: (error, errorInfo) => {
      console.error(`Error in ${componentName}:`, error, errorInfo);
      toast.error(`An error occurred in ${componentName}`, {
        description: 'Please refresh the page and try again.'
      });
    },
    
    fallback: (error) => (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-red-800 font-medium mb-2">Something went wrong</h3>
        <p className="text-red-600 text-sm">
          An error occurred in {componentName}. Please refresh the page and try again.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2">
            <summary className="text-red-700 text-xs cursor-pointer">Error details</summary>
            <pre className="text-xs text-red-600 mt-1 overflow-auto">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    )
  };
};

/**
 * Retry mechanism for failed operations
 * @param {Function} operation - Operation to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of the operation
 */
export const withRetry = async (operation, options = {}) => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 1.5,
    context = 'Operation'
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Don't retry on certain error types
      const parsedError = parseError(error);
      if ([ERROR_TYPES.AUTHENTICATION, ERROR_TYPES.AUTHORIZATION, ERROR_TYPES.VALIDATION].includes(parsedError.type)) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, attempt - 1)));
    }
  }
  
  throw lastError;
};

export default {
  ERROR_TYPES,
  parseError,
  handleError,
  handleValidationErrors,
  withErrorHandling,
  createErrorBoundary,
  withRetry
};
