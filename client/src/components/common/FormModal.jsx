import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
// Removed Select import - using native select elements

const FormModal = ({
  isOpen,
  onOpenChange,
  title,
  description,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  children,
  className = ''
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange || (() => {})}>
      <DialogContent className={`sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[1200px] w-full max-h-[90vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description || `Fill out the form below to ${title.toLowerCase()}`}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {children}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || (() => (onOpenChange || (() => {}))(false))}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Reusable form field components
export const FormField = ({ label, error, required, children, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}>
      {label}
    </Label>
    {children}
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export const FormInput = ({ label, error, required, ...props }) => (
  <FormField label={label} error={error} required={required}>
    <Input {...props} />
  </FormField>
);

export const FormTextarea = ({ label, error, required, ...props }) => (
  <FormField label={label} error={error} required={required}>
    <Textarea {...props} />
  </FormField>
);

export const FormSelect = ({ label, error, required, options, placeholder, value, onChange, name, ...props }) => (
  <FormField label={label} error={error} required={required}>
    <select
      value={value || ''}
      onChange={onChange}
      name={name}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      required={required}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </FormField>
);

export default FormModal;
