import React, { useState, useEffect } from 'react';
import FormModal, { FormInput, FormSelect, FormTextarea } from '../common/FormModal';
import ProductSelector from './ProductSelector';
import ClientSelector from '../clients/ClientSelector';
import OrderItemsTable from './OrderItemsTable';
import OrderSummary from './OrderSummary';

const statusOptions = [
  { value: 'pending', label: 'Pending (Awaiting Confirmation)' },
  { value: 'confirmed', label: 'Confirmed (Ready for Pickup)' },
  { value: 'in_progress', label: 'In Progress (Items Rented Out)' },
  { value: 'completed', label: 'Completed (Items Returned)' },
  { value: 'cancelled', label: 'Cancelled' }
];

const paymentStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' }
];

const OrderForm = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  errors,
  isSubmitting,
  editingOrder,
  clientOptions,
  // Product selection props
  productSearch,
  setProductSearch,
  quantity,
  setQuantity,
  filteredProducts,
  selectedProduct,
  setSelectedProduct,
  orderItems,
  onAddItem,
  onUpdateQuantity,
  onUpdateUnitPrice,
  onRemoveItem,
  totals,
  currentUser
}) => {
  // Client selection state
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [filteredClients, setFilteredClients] = useState([]);

  // Filter clients based on search
  useEffect(() => {
    if (!clientSearch) {
      setFilteredClients(clientOptions || []);
      return;
    }
    
    const searchTerm = clientSearch.toLowerCase();
    const filtered = (clientOptions || []).filter(
      client => 
        client.name.toLowerCase().includes(searchTerm) ||
        (client.company && client.company.toLowerCase().includes(searchTerm))
    );
    setFilteredClients(filtered);
  }, [clientSearch, clientOptions]);

  // Handle client selection
  useEffect(() => {
    if (formData.client) {
      const client = clientOptions?.find(c => c._id === formData.client);
      if (client) {
        setSelectedClient(client);
        setClientSearch(`${client.name}${client.company ? ` (${client.company})` : ''}`);
      }
    }
  }, [formData.client, clientOptions]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }
    
    // Update form data with selected client
    onFormChange('client', selectedClient._id);
    
    // Submit the form
    onSubmit(e);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={editingOrder ? 'Edit Order' : 'Create New Order'}
      onSubmit={handleSubmit}
      loading={isSubmitting}
    >
      <div className="space-y-6">
        {/* Order Details Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Order Details</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Client <span className="text-destructive">*</span>
            </label>
            <ClientSelector
              clientSearch={clientSearch}
              setClientSearch={setClientSearch}
              filteredClients={filteredClients}
              selectedClient={selectedClient}
              setSelectedClient={setSelectedClient}
              onClearClient={() => onFormChange('client', '')}
            />
            {errors.client && (
              <p className="text-sm font-medium text-destructive">{errors.client}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => onFormChange('startDate', e.target.value)}
              error={errors.startDate}
              required
            />
            
            <FormInput
              label="End Date"
              name="endDate"
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => onFormChange('endDate', e.target.value)}
              error={errors.endDate}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Status"
              name="status"
              value={formData.status || 'pending'}
              onChange={(e) => onFormChange('status', e.target.value)}
              error={errors.status}
              required
              options={statusOptions}
            />
            
            <FormSelect
              label="Payment Status"
              name="paymentStatus"
              value={formData.paymentStatus || 'pending'}
              onChange={(e) => onFormChange('paymentStatus', e.target.value)}
              error={errors.paymentStatus}
              required
              options={paymentStatusOptions}
            />
          </div>
        </div>

        {/* Products & Summary Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Products & Summary</h3>
          
          {/* Product Selection */}
          <ProductSelector
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            quantity={quantity}
            setQuantity={setQuantity}
            filteredProducts={filteredProducts}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            onAddItem={onAddItem}
          />

          {/* Order Items List */}
          <OrderItemsTable
            orderItems={orderItems}
            onUpdateQuantity={onUpdateQuantity}
            onUpdateUnitPrice={onUpdateUnitPrice}
            onRemoveItem={onRemoveItem}
            currentUser={currentUser}
          />

          {/* Order Summary */}
          {orderItems.length > 0 && (
            <OrderSummary
              totals={totals}
              discount={formData.discount}
            />
          )}
        </div>

        {/* Payment Details Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Payment Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Deposit (KES)"
              name="deposit"
              type="number"
              value={formData.deposit || ''}
              onChange={(e) => onFormChange('deposit', e.target.value)}
              error={errors.deposit}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
            
            <FormInput
              label="Discount (%)"
              name="discount"
              type="number"
              value={formData.discount || ''}
              onChange={(e) => onFormChange('discount', e.target.value)}
              error={errors.discount}
              min="0"
              max="100"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <FormTextarea
            label="Notes"
            name="notes"
            value={formData.notes || ''}
            onChange={(e) => onFormChange('notes', e.target.value)}
            error={errors.notes}
            placeholder="Additional notes about the order..."
            rows={3}
          />
        </div>
      </div>
    </FormModal>
  );
};

export default OrderForm;
