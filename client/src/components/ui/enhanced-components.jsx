// Enhanced UI components index file
// This file exports all UI components for easy importing across the application

// Base UI components
export { Button, buttonVariants } from './button';
export { Input } from './input';
export { Label } from './label';
export { Checkbox } from './checkbox';
export { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './select';
export { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from './table';
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './dialog';
export { Badge, badgeVariants } from './badge';

// Layout components
export const PageContainer = ({ children, className = '' }) => (
  <div className={`container mx-auto px-4 py-6 ${className}`}>
    {children}
  </div>
);

export const PageHeader = ({ title, description, actions, className = '' }) => (
  <div className={`mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}>
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground mt-1">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const PageContent = ({ children, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {children}
  </div>
);

export const ContentSection = ({ title, description, children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {(title || description) && (
      <div>
        {title && <h2 className="text-xl font-semibold">{title}</h2>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    )}
    {children}
  </div>
);

export const Grid = ({ children, cols = 1, gap = 4, className = '' }) => {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[cols] || 'grid-cols-1';
  
  const gapClass = `gap-${gap}`;
  
  return (
    <div className={`grid ${colsClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};

// Status badge component for consistent status display
export const StatusBadge = ({ status, className = '' }) => {
  const statusConfig = {
    pending: { variant: 'outline', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    confirmed: { variant: 'outline', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    in_progress: { variant: 'outline', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    completed: { variant: 'outline', className: 'bg-green-50 text-green-700 border-green-200' },
    cancelled: { variant: 'outline', className: 'bg-gray-50 text-gray-700 border-gray-200' },
    paid: { variant: 'outline', className: 'bg-green-50 text-green-700 border-green-200' },
    partially_paid: { variant: 'outline', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    unpaid: { variant: 'outline', className: 'bg-red-50 text-red-700 border-red-200' },
  }[status?.toLowerCase()] || { variant: 'outline', className: 'bg-gray-50 text-gray-700 border-gray-200' };

  return (
    <Badge 
      variant={statusConfig.variant} 
      className={`${statusConfig.className} ${className}`}
    >
      {status?.replace('_', ' ')}
    </Badge>
  );
};
