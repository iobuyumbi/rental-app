import React from 'react';
import FormModal, { FormInput, FormSelect, FormTextarea } from '../common/FormModal';

const categoryTypeOptions = [
  { value: 'TENT', label: 'Tent' },
  { value: 'CHAIR', label: 'Chair' },
  { value: 'TABLE', label: 'Table' },
  { value: 'UTENSIL', label: 'Utensil' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'LIGHTING', label: 'Lighting' },
  { value: 'SOUND', label: 'Sound' },
  { value: 'OTHER', label: 'Other' }
];

const CategoryForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onFormChange, 
  errors, 
  isSubmitting, 
  editingCategory 
}) => {
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={editingCategory ? 'Edit Category' : 'Add New Category'}
      onSubmit={onSubmit}
      loading={isSubmitting}
    >
      <FormInput
        label="Category Name"
        name="name"
        value={formData.name || ''}
        onChange={(e) => onFormChange('name', e.target.value)}
        error={errors.name}
        required
        placeholder="Enter category name"
      />
      
      <FormSelect
        label="Category Type"
        name="type"
        value={formData.type || ''}
        onChange={(e) => onFormChange('type', e.target.value)}
        error={errors.type}
        required
        options={categoryTypeOptions}
        placeholder="Select category type"
      />
      
      <FormTextarea
        label="Description"
        name="description"
        value={formData.description || ''}
        onChange={(e) => onFormChange('description', e.target.value)}
        error={errors.description}
        placeholder="Category description..."
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Rental Price Multiplier"
          name="rentalPriceMultiplier"
          type="number"
          step="0.1"
          min="0.1"
          value={formData.rentalPriceMultiplier || ''}
          onChange={(e) => onFormChange('rentalPriceMultiplier', e.target.value)}
          error={errors.rentalPriceMultiplier}
          placeholder="1.0"
        />
        
        <FormInput
          label="Maintenance Interval (Days)"
          name="maintenanceIntervalDays"
          type="number"
          min="0"
          value={formData.maintenanceIntervalDays || ''}
          onChange={(e) => onFormChange('maintenanceIntervalDays', e.target.value)}
          error={errors.maintenanceIntervalDays}
          placeholder="0"
        />
      </div>
      
      <FormInput
        label="Image URL"
        name="imageUrl"
        type="url"
        value={formData.imageUrl || ''}
        onChange={(e) => onFormChange('imageUrl', e.target.value)}
        error={errors.imageUrl}
        placeholder="https://..."
      />
    </FormModal>
  );
};

export default CategoryForm;
