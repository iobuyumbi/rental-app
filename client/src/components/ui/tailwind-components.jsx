/**
 * Enhanced UI Components - Tailwind CSS Version
 * No custom CSS file needed - uses pure Tailwind classes
 */

import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming you have a cn utility

// Button Component with Tailwind variants
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 shadow-sm',
    outline: 'border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 text-gray-700 bg-white focus:ring-blue-500',
    ghost: 'hover:bg-gray-100 text-gray-600 focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-sm',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500 shadow-sm',
    error: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
    icon: 'p-2 h-9 w-9'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

// Badge Component
export const Badge = ({ children, variant = 'primary', size = 'md', className = '' }) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  
  const variants = {
    primary: 'bg-blue-100 text-blue-800 border border-blue-200',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    outline: 'bg-white text-gray-700 border border-gray-300'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={cn(baseClasses, variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};

// Status Badge with automatic coloring
export const StatusBadge = ({ status, className = '' }) => {
  const statusConfig = {
    pending: { variant: 'warning', label: 'Pending' },
    confirmed: { variant: 'info', label: 'Confirmed' },
    in_progress: { variant: 'primary', label: 'In Progress' },
    completed: { variant: 'success', label: 'Completed' },
    cancelled: { variant: 'error', label: 'Cancelled' }
  };

  const config = statusConfig[status] || { variant: 'outline', label: status };
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

// Input Component
export const Input = ({ 
  label, 
  error, 
  required = false, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Select Component
export const Select = ({ 
  label, 
  error, 
  required = false, 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Textarea Component
export const Textarea = ({ 
  label, 
  error, 
  required = false, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed resize-vertical',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Card Components
export const Card = ({ children, className = '' }) => (
  <div className={cn('bg-white rounded-xl shadow-sm border border-gray-200', className)}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={cn('text-lg font-semibold text-gray-900', className)}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
);

// Modal Component
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '' 
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        <div className={cn(
          'relative bg-white rounded-xl shadow-xl w-full transform transition-all',
          sizes[size],
          className
        )}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Table Components
export const Table = ({ children, className = '' }) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
    <table className={cn('min-w-full divide-y divide-gray-200', className)}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className = '' }) => (
  <thead className={cn('bg-gray-50', className)}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '' }) => (
  <tbody className={cn('bg-white divide-y divide-gray-200', className)}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '' }) => (
  <tr className={cn('hover:bg-gray-50 transition-colors', className)}>
    {children}
  </tr>
);

export const TableHead = ({ children, className = '' }) => (
  <th className={cn('px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider', className)}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '' }) => (
  <td className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className)}>
    {children}
  </td>
);

// Layout Components
export const PageContainer = ({ children, className = '' }) => (
  <div className={cn('min-h-screen bg-gray-50', className)}>
    {children}
  </div>
);

export const PageHeader = ({ title, description, actions = [], className = '' }) => (
  <div className={cn('bg-white border-b border-gray-200 px-6 py-8', className)}>
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-2 text-gray-600">{description}</p>
        )}
      </div>
      {actions.length > 0 && (
        <div className="flex items-center space-x-3">
          {actions}
        </div>
      )}
    </div>
  </div>
);

export const PageContent = ({ children, className = '' }) => (
  <div className={cn('p-6 space-y-6', className)}>
    {children}
  </div>
);

export const ContentSection = ({ title, actions = [], children, className = '' }) => (
  <div className={cn('bg-white rounded-xl shadow-sm border border-gray-200', className)}>
    {(title || actions.length > 0) && (
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
        {actions.length > 0 && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

// Grid Component
export const Grid = ({ children, cols = 1, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <div className={cn('grid gap-6', gridCols[cols], className)}>
      {children}
    </div>
  );
};

// Form Components
export const FormGroup = ({ children, className = '' }) => (
  <div className={cn('space-y-2', className)}>
    {children}
  </div>
);

export const Label = ({ children, required = false, className = '' }) => (
  <label className={cn('block text-sm font-medium text-gray-700', className)}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

export const FormError = ({ children, className = '' }) => (
  <p className={cn('text-sm text-red-600', className)}>
    {children}
  </p>
);

export const FormHelp = ({ children, className = '' }) => (
  <p className={cn('text-sm text-gray-500', className)}>
    {children}
  </p>
);

// Financial Impact Component
export const FinancialImpact = ({ 
  originalAmount, 
  adjustedAmount, 
  title = "Financial Impact",
  className = '' 
}) => {
  const difference = adjustedAmount - originalAmount;
  const isPositive = difference > 0;
  const isNegative = difference < 0;

  return (
    <div className={cn(
      'p-4 rounded-lg border-2',
      isPositive && 'bg-red-50 border-red-200',
      isNegative && 'bg-green-50 border-green-200',
      difference === 0 && 'bg-blue-50 border-blue-200',
      className
    )}>
      <h4 className={cn(
        'font-semibold mb-2',
        isPositive && 'text-red-800',
        isNegative && 'text-green-800',
        difference === 0 && 'text-blue-800'
      )}>
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Original:</span>
          <span className="font-medium ml-2">KES {originalAmount?.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-600">Adjusted:</span>
          <span className="font-medium ml-2">KES {adjustedAmount?.toFixed(2)}</span>
        </div>
        <div className="col-span-2 pt-2 border-t">
          <span className="text-gray-600">Difference:</span>
          <span className={cn(
            'font-bold ml-2',
            isPositive && 'text-red-600',
            isNegative && 'text-green-600',
            difference === 0 && 'text-blue-600'
          )}>
            {difference > 0 ? '+' : ''}KES {difference.toFixed(2)}
            {isPositive && ' (Additional Charge)'}
            {isNegative && ' (Refund Due)'}
            {difference === 0 && ' (No Change)'}
          </span>
        </div>
      </div>
    </div>
  );
};
