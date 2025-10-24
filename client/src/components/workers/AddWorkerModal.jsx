import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { workersAPI } from '../../services/api';

/**
 * AddWorkerModal - Inline worker creation modal
 * Features:
 * - Clean form validation
 * - Loading states
 * - Auto-selection after creation
 * - Keyboard navigation (Esc to close)
 * - Mobile responsive
 */
const AddWorkerModal = ({ 
  isOpen, 
  onClose, 
  onWorkerAdded 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    nationalId: '',
    dailyRate: '0',
    skills: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'National ID is required';
    }
    
    if (!formData.dailyRate || parseFloat(formData.dailyRate) < 0) {
      newErrors.dailyRate = 'Daily rate must be 0 or greater (0 = task-based payment)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const workerData = {
        ...formData,
        dailyRate: parseFloat(formData.dailyRate),
        status: 'active'
      };

      const response = await workersAPI.workers.create(workerData);
      
      if (response && response.data) {
        toast.success('Worker added successfully');
        onWorkerAdded(response.data); // Auto-select the new worker
        handleClose();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error creating worker:', error);
      toast.error(error.message || 'Failed to add worker');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        phone: '',
        nationalId: '',
        dailyRate: '0',
        skills: '',
        notes: ''
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Worker
          </DialogTitle>
          <DialogDescription>
            Create a new worker profile and add them to this order
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter worker's full name"
              className={errors.name ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+254 700 000 000"
              className={errors.phone ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* National ID */}
          <div className="space-y-2">
            <Label htmlFor="nationalId">National ID *</Label>
            <Input
              id="nationalId"
              value={formData.nationalId}
              onChange={(e) => handleChange('nationalId', e.target.value)}
              placeholder="Enter national ID number"
              className={errors.nationalId ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.nationalId && (
              <p className="text-sm text-red-600">{errors.nationalId}</p>
            )}
          </div>

          {/* Daily Rate */}
          <div className="space-y-2">
            <Label htmlFor="dailyRate">Daily Rate (KES) * - Use 0 for task-based payment</Label>
            <Input
              id="dailyRate"
              type="number"
              min="0"
              step="0.01"
              value={formData.dailyRate}
              onChange={(e) => handleChange('dailyRate', e.target.value)}
              placeholder="0"
              className={errors.dailyRate ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.dailyRate && (
              <p className="text-sm text-red-600">{errors.dailyRate}</p>
            )}
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills">Skills/Specialization</Label>
            <Input
              id="skills"
              value={formData.skills}
              onChange={(e) => handleChange('skills', e.target.value)}
              placeholder="e.g., Cleaning, Setup, Technical"
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes about the worker"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Worker
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWorkerModal;
