import { toast as sonnerToast } from 'sonner';
import { useCallback } from 'react';

/**
 * Custom hook to wrap the 'sonner' library, providing a consistent
 * and simplified API for displaying toast notifications across the application.
 * @returns {{toast: Object}} An object containing the toast API methods.
 */
export function useToast() {

  const success = useCallback((message, opts = {}) => {
    sonnerToast.success(message, opts);
  }, []);

  const error = useCallback((message, opts = {}) => {
    sonnerToast.error(message, opts);
  }, []);

  // For info and warning, we typically use the base toast function
  // as 'sonner' does not natively expose .info or .warning methods.
  const info = useCallback((message, opts = {}) => {
    sonnerToast(message, opts);
  }, []);

  const warning = useCallback((message, opts = {}) => {
    // Falls back to the default toast style
    sonnerToast(message, opts);
  }, []);

  const toast = {
    success,
    error,
    info,
    warning,
    // Expose the raw sonner toast for advanced usage if needed
    raw: sonnerToast,
  };

  return { toast };
}
