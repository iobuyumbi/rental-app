import React from 'react';
import FormModal, { FormInput, FormSelect, FormTextarea } from '../common/FormModal';

const PurchaseForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onFormChange, 
  errors, 
  isSubmitting, 
  productOptions 
}) => {
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Record New Purchase"
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
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Quantity"
          name="quantity"
          type="number"
          value={formData.quantity || ''}
          onChange={(e) => onFormChange('quantity', e.target.value)}
          error={errors.quantity}
          required
          min="1"
          placeholder="1"
        />
        
        <FormInput
          label="Unit Cost (Ksh)"
          name="unitCost"
          type="number"
          value={formData.unitCost || ''}
          onChange={(e) => onFormChange('unitCost', e.target.value)}
          error={errors.unitCost}
          required
          min="0"
          step="0.01"
          placeholder="0.00"
        />
      </div>
      
      <FormInput
        label="Supplier"
        name="supplier"
        value={formData.supplier || ''}
        onChange={(e) => onFormChange('supplier', e.target.value)}
        error={errors.supplier}
        required
        placeholder="Supplier name"
      />
      
      <FormInput
        label="Purchase Date"
        name="purchaseDate"
        type="date"
        value={formData.purchaseDate || ''}
        onChange={(e) => onFormChange('purchaseDate', e.target.value)}
        error={errors.purchaseDate}
        required
      />
      
      <FormTextarea
        label="Description"
        name="description"
        value={formData.description || ''}
        onChange={(e) => onFormChange('description', e.target.value)}
        error={errors.description}
        placeholder="Additional details about the purchase..."
        rows={3}
      />
    </FormModal>
  );
};

export default PurchaseForm;
