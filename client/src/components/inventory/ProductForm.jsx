import React from 'react';
import FormModal, { FormInput, FormSelect, FormTextarea } from '../common/FormModal';

const conditionOptions = [
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Needs Repair', label: 'Needs Repair' }
];

const ProductForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onFormChange, 
  errors, 
  isSubmitting, 
  editingProduct,
  categoryOptions 
}) => {
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={editingProduct ? 'Edit Product' : 'Add New Product'}
      onSubmit={onSubmit}
      loading={isSubmitting}
    >
      <FormInput
        label="Product Name"
        name="name"
        value={formData.name || ''}
        onChange={(e) => onFormChange('name', e.target.value)}
        error={errors.name}
        required
        placeholder="Enter product name"
      />
      
      <FormSelect
        label="Category"
        name="category"
        value={formData.category || ''}
        onChange={(e) => onFormChange('category', e.target.value)}
        error={errors.category}
        required
        options={categoryOptions}
        placeholder="Select category"
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Rental Price (KES)"
          name="rentalPrice"
          type="number"
          value={formData.rentalPrice || ''}
          onChange={(e) => onFormChange('rentalPrice', e.target.value)}
          error={errors.rentalPrice}
          required
          placeholder="0.00"
        />
        
        <FormInput
          label="Purchase Price (KES)"
          name="purchasePrice"
          type="number"
          value={formData.purchasePrice || ''}
          onChange={(e) => onFormChange('purchasePrice', e.target.value)}
          error={errors.purchasePrice}
          placeholder="0.00"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Quantity in Stock"
          name="quantityInStock"
          type="number"
          value={formData.quantityInStock || ''}
          onChange={(e) => onFormChange('quantityInStock', e.target.value)}
          error={errors.quantityInStock}
          required
          placeholder="0"
        />
        
        <FormSelect
          label="Condition"
          name="condition"
          value={formData.condition || ''}
          onChange={(e) => onFormChange('condition', e.target.value)}
          error={errors.condition}
          required
          options={conditionOptions}
          placeholder="Select condition"
        />
      </div>
      
      <FormTextarea
        label="Description"
        name="description"
        value={formData.description || ''}
        onChange={(e) => onFormChange('description', e.target.value)}
        error={errors.description}
        placeholder="Product description..."
      />
      
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

export default ProductForm;
