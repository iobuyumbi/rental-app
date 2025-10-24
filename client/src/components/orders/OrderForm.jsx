import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import FormModal, { FormInput, FormSelect, FormTextarea } from '../common/FormModal';
import ProductSelector from './ProductSelector';
import ClientSelector from '../clients/ClientSelector';
import OrderItemsTable from './OrderItemsTable';
import OrderSummary from './OrderSummary';
import { calculateChargeableDays, formatDate } from '../../utils/dateUtils';

const statusOptions = [
  { value: 'pending', label: 'Pending (Awaiting Confirmation)' },
  { value: 'confirmed', label: 'Confirmed (Ready for Pickup)' },
  { value: 'in_progress', label: 'In Progress (Items Rented Out)' },
  { value: 'completed', label: 'Completed (Items Returned)' },
  { value: 'cancelled', label: 'Cancelled' }
];

const paymentStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' }
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
  onAddNewClient,
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
  onUpdateDaysUsed,
  onRemoveItem,
  totals,
  currentUser
}) => {
  // Client selection state
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [filteredClients, setFilteredClients] = useState([]);
  
  // Client creation modal state
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    type: 'direct',
    status: 'active',
    notes: ''
  });
  const [clientFormErrors, setClientFormErrors] = useState({});
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // Filter clients based on search
  useEffect(() => {
    if (!clientSearch) {
      setFilteredClients(clientOptions || []);
      return;
    }
    
    const searchTerm = clientSearch.toLowerCase();
    const filtered = (clientOptions || []).filter(
      client => 
        client.contactPerson.toLowerCase().includes(searchTerm) ||
        (client.name && client.name.toLowerCase().includes(searchTerm)) ||
        (client.phone && client.phone.toLowerCase().includes(searchTerm))
    );
    setFilteredClients(filtered);
  }, [clientSearch, clientOptions]);

  // Handle client selection
  useEffect(() => {
    if (formData.client) {
      const client = clientOptions?.find(c => c._id === formData.client);
      if (client) {
        setSelectedClient(client);
        // Display individual's name with optional company name
        const displayName = client.name ? 
          `${client.contactPerson} (${client.name})` : 
          client.contactPerson;
        setClientSearch(displayName);
      }
    }
  }, [formData.client, clientOptions]);

  // Handle opening client creation modal
  const handleAddNewClient = (searchTerm = '') => {
    setNewClientData({
      name: searchTerm || '',
      contactPerson: searchTerm || '',
      email: '',
      phone: '',
      address: '',
      type: 'direct',
      status: 'active',
      notes: ''
    });
    setClientFormErrors({});
    setShowClientModal(true);
  };

  // Handle client form input changes
  const handleClientFormChange = (field, value) => {
    setNewClientData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (clientFormErrors[field]) {
      setClientFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate client form
  const validateClientForm = () => {
    const errors = {};
    if (!newClientData.name.trim()) errors.name = 'Company name is required';
    if (!newClientData.contactPerson.trim()) errors.contactPerson = 'Contact person is required';
    if (!newClientData.email.trim()) errors.email = 'Email is required';
    if (!newClientData.phone.trim()) errors.phone = 'Phone is required';
    if (!newClientData.address.trim()) errors.address = 'Address is required';
    
    // Email format validation
    // Escape dot is not needed inside character class; keep it outside where needed
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (newClientData.email && !emailRegex.test(newClientData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    return errors;
  };

  // Handle client creation submission
  const handleClientSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateClientForm();
    if (Object.keys(errors).length > 0) {
      setClientFormErrors(errors);
      return;
    }
    
    setIsCreatingClient(true);
    try {
      const newClient = await onAddNewClient(newClientData);
      if (newClient) {
        // Close modal and select the new client
        setShowClientModal(false);
        setSelectedClient(newClient);
        const displayName = newClient.name ? 
          `${newClient.contactPerson} (${newClient.name})` : 
          newClient.contactPerson;
        setClientSearch(displayName);
        onFormChange('client', newClient._id);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      
      // Handle specific error types
      if (error.message.includes('Email already exists') || error.message.includes('already exists')) {
        setClientFormErrors({ email: error.message });
      } else if (error.message.includes('Duplicate field value')) {
        setClientFormErrors({ email: 'This email address is already in use. Please use a different email.' });
      } else {
        // Generic error handling
        setClientFormErrors({ general: error.message || 'Failed to create client. Please try again.' });
      }
    } finally {
      setIsCreatingClient(false);
    }
  };

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
    <>
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
              onAddNewClient={handleAddNewClient}
            />
            {errors.client && (
              <p className="text-sm font-medium text-destructive">{errors.client}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Company/Organization for this Order
            </label>
            <FormInput
              name="orderCompany"
              type="text"
              value={formData.orderCompany || ''}
              onChange={(e) => onFormChange('orderCompany', e.target.value)}
              error={errors.orderCompany}
              placeholder="Enter company/organization name for this specific order (optional)"
            />
            <p className="text-xs text-muted-foreground">
              This can be different from the client's default company. Leave blank if not applicable.
            </p>
          </div>

          {/* Rental Period */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Rental Period</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                label="Rental Start Date"
                name="startDate"
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => onFormChange('startDate', e.target.value)}
                error={errors.startDate}
                required
                className="w-full"
              />
              
              <FormInput
                label="Expected Return Date"
                name="endDate"
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => onFormChange('endDate', e.target.value)}
                error={errors.endDate}
                required
                className="w-full"
              />

              <FormInput
                label="Default Chargeable Days"
                name="defaultChargeableDays"
                type="number"
                min="1"
                value={formData.defaultChargeableDays || '1'}
                onChange={(e) => onFormChange('defaultChargeableDays', parseInt(e.target.value) || 1)}
                error={errors.defaultChargeableDays}
                required
                className="w-full"
                placeholder="1"
              />
            </div>
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p><strong>Note:</strong> Rental period includes setup, event day, and return time.</p>
              <p><strong>Default Chargeable Days:</strong> Actual usage days for pricing (typically 1 for event day only).</p>
              <p>You can customize chargeable days per item in the products table below.</p>
            </div>
          </div>

          <FormInput
            label="Delivery/Pickup Location"
            name="location"
            type="text"
            value={formData.location || ''}
            onChange={(e) => onFormChange('location', e.target.value)}
            error={errors.location}
            placeholder="Where should the rental items be delivered/picked up? (Optional)"
          />
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
            onUpdateDaysUsed={onUpdateDaysUsed}
            onRemoveItem={onRemoveItem}
            currentUser={currentUser}
            defaultChargeableDays={formData.defaultChargeableDays || 1}
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
          
          {/* Status Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Order Status"
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
          
          {/* Payment Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Client Creation Modal */}
      {showClientModal && (
        <FormModal
          isOpen={showClientModal}
          onOpenChange={(open) => !open && setShowClientModal(false)}
          title="Add New Client"
          onSubmit={handleClientSubmit}
          isSubmitting={isCreatingClient}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Company/Organization Name"
                name="name"
                value={newClientData.name}
                onChange={(e) => handleClientFormChange('name', e.target.value)}
                error={clientFormErrors.name}
                required
                placeholder="Enter company or organization name"
              />
              
              <FormInput
                label="Contact Person"
                name="contactPerson"
                value={newClientData.contactPerson}
                onChange={(e) => handleClientFormChange('contactPerson', e.target.value)}
                error={clientFormErrors.contactPerson}
                required
                placeholder="Enter contact person's name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={newClientData.email}
                onChange={(e) => handleClientFormChange('email', e.target.value)}
                error={clientFormErrors.email}
                required
                placeholder="client@example.com"
              />
              
              <FormInput
                label="Phone"
                name="phone"
                type="tel"
                value={newClientData.phone}
                onChange={(e) => handleClientFormChange('phone', e.target.value)}
                error={clientFormErrors.phone}
                required
                placeholder="+254 700 000 000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Client Type"
                name="type"
                value={newClientData.type}
                onChange={(e) => handleClientFormChange('type', e.target.value)}
                error={clientFormErrors.type}
                required
                options={[
                  { value: 'direct', label: 'Direct Client' },
                  { value: 'vendor', label: 'Vendor' }
                ]}
              />
              
              <FormSelect
                label="Status"
                name="status"
                value={newClientData.status}
                onChange={(e) => handleClientFormChange('status', e.target.value)}
                error={clientFormErrors.status}
                required
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'blacklisted', label: 'Blacklisted' }
                ]}
              />
            </div>

            <FormInput
              label="Address"
              name="address"
              value={newClientData.address}
              onChange={(e) => handleClientFormChange('address', e.target.value)}
              error={clientFormErrors.address}
              required
              placeholder="Client's address"
            />

            <FormTextarea
              label="Notes"
              name="notes"
              value={newClientData.notes}
              onChange={(e) => handleClientFormChange('notes', e.target.value)}
              error={clientFormErrors.notes}
              placeholder="Additional notes about the client..."
              rows={3}
            />
          </div>
        </FormModal>
      )}
    </>
  );
};

export default OrderForm;
