import { toast as sonnerToast } from 'sonner';

// Simple wrapper to keep a consistent API across the app
export function useToast() {
  const toast = {
    success: (message, opts = {}) => sonnerToast.success(message, opts),
    error: (message, opts = {}) => sonnerToast.error(message, opts),
    info: (message, opts = {}) => sonnerToast(message, opts),
    warning: (message, opts = {}) => sonnerToast.warning?.(message, opts) || sonnerToast(message, opts),
    // Expose the raw sonner toast for advanced usage
    raw: sonnerToast,
  };

  return { toast };
}
