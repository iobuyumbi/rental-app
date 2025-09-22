import React from 'react';
import FormModal, { FormInput, FormSelect, FormTextarea } from '../common/FormModal';

const lunchAllowanceStatusOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Provided', label: 'Provided' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const LunchAllowanceForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onFormChange, 
  errors, 
  isSubmitting, 
  workerOptions 
}) => {
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Add Lunch Allowance"
      onSubmit={onSubmit}
      loading={isSubmitting}
    >
      <FormSelect
        label="Worker"
        name="workerId"
        value={formData.workerId || ''}
        onChange={(e) => onFormChange('workerId', e.target.value)}
        error={errors.workerId}
        required
        options={workerOptions}
        placeholder="Select worker"
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Amount (KES)"
          name="amount"
          type="number"
          value={formData.amount || ''}
          onChange={(e) => onFormChange('amount', e.target.value)}
          error={errors.amount}
          required
          min="0"
          step="0.01"
          placeholder="0.00"
        />
        
        <FormInput
          label="Date"
          name="date"
          type="date"
          value={formData.date || ''}
          onChange={(e) => onFormChange('date', e.target.value)}
          error={errors.date}
          required
        />
      </div>
      
      <FormSelect
        label="Status"
        name="status"
        value={formData.status || 'Pending'}
        onChange={(e) => onFormChange('status', e.target.value)}
        error={errors.status}
        required
        options={lunchAllowanceStatusOptions}
      />
      
      <FormTextarea
        label="Notes"
        name="notes"
        value={formData.notes || ''}
        onChange={(e) => onFormChange('notes', e.target.value)}
        error={errors.notes}
        placeholder="Additional notes about the lunch allowance..."
        rows={3}
      />
    </FormModal>
  );
};

export default LunchAllowanceForm;
