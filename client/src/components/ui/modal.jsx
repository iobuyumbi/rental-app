import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  size = 'medium', // 'small', 'medium', 'large', 'xlarge'
  className = '' 
}) => {
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-xl',
    xlarge: 'max-w-2xl'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${sizeClasses[size]} max-h-[90vh] overflow-y-auto ${className}`}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;