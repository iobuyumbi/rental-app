import React from 'react';
import FormModal, { FormInput, FormSelect, FormTextarea } from '../common/FormModal';

const repairStatusOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const RepairForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onFormChange, 
  errors, 
  isSubmitting, 
  productOptions,
  editingRepair 
}) => {
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={editingRepair ? 'Edit Repair' : 'Record New Repair'}
      onSubmit={onSubmit}
      loading={isSubmitting}
    >
      <FormSelect
        label="Product"
        name="productId"
        value={formData.productId || ''}
        onChange={(e) => onFormChange('productId', e.target.value)}
        error={errors.productId}
        required
        options={productOptions}
        placeholder="Select product"
      />
      
      <FormTextarea
        label="Description"
        name="description"
        value={formData.description || ''}
        onChange={(e) => onFormChange('description', e.target.value)}
        error={errors.description}
        required
        placeholder="Describe the repair work needed..."
        rows={3}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Repair Cost (Ksh)"
          name="cost"
          type="number"
          value={formData.cost || ''}
          onChange={(e) => onFormChange('cost', e.target.value)}
          error={errors.cost}
          required
          min="0"
          step="0.01"
          placeholder="0.00"
        />
        
        <FormInput
          label="Repair Date"
          name="repairDate"
          type="date"
          value={formData.repairDate || ''}
          onChange={(e) => onFormChange('repairDate', e.target.value)}
          error={errors.repairDate}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          label="Status"
          name="status"
          value={formData.status || 'Pending'}
          onChange={(e) => onFormChange('status', e.target.value)}
          error={errors.status}
          required
          options={repairStatusOptions}
        />
        
        <FormInput
          label="Technician"
          name="technician"
          value={formData.technician || ''}
          onChange={(e) => onFormChange('technician', e.target.value)}
          error={errors.technician}
          placeholder="Technician name"
        />
      </div>
    </FormModal>
  );
};

export default RepairForm;
