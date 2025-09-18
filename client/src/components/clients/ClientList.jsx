import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import DataTable from '../common/DataTable';
import FormModal, { FormInput, FormSelect, FormTextarea } from '../common/FormModal';
import useDataManager from '../../hooks/useDataManager';
import { useFormManager } from '../../hooks/useFormManager';
import { ordersAPI } from '../../services/api';
import { toast } from 'sonner';

const ClientList = () => {
  const [clientType, setClientType] = useState('all');
  const [showAddClient, setShowAddClient] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Use the new data manager hook with proper client API
  const {
    data: clients,
    loading,
    error,
    createItem: createClient,
    updateItem: updateClient,
    deleteItem: deleteClient,
    refresh: refreshClients
  } = useDataManager({
    fetchFn: ordersAPI.getClients,
    createFn: ordersAPI.addClient,
    entityName: 'client',
    autoLoad: true
  });

  // Form management for client creation/editing
  const clientForm = useFormManager({
    initialData: {
      name: '',
      email: '',
      phone: '',
      type: 'direct',
      status: 'active',
      address: '',
      notes: ''
    },
    validationRules: {
      name: { required: true },
      email: { required: true, email: true },
      phone: { required: true },
      type: { required: true },
      status: { required: true }
    },
    onSubmit: async (formData) => {
      if (editingClient) {
        await updateClient(editingClient._id, formData);
      } else {
        await createClient(formData);
      }
      handleCloseModal();
    }
  });

  // Filter clients by type
  const filteredClients = clients.filter(client => 
    clientType === 'all' || client.type === clientType
  );

  // Define table columns
  const columns = [
    {
      header: 'Name',
      accessor: 'name'
    },
    {
      header: 'Email',
      accessor: 'email'
    },
    {
      header: 'Phone',
      accessor: 'phone'
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (value, client) => (
        <span className="capitalize">{client?.type || 'N/A'}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      type: 'badge',
      getBadgeVariant: (status) => {
        switch (status) {
          case 'active': return 'default';
          case 'inactive': return 'secondary';
          default: return 'destructive';
        }
      }
    }
  ];

  // Custom actions for each row
  const actions = [
    {
      label: 'View Details',
      icon: Users,
      onClick: (client) => {
        // Navigate to client details
        window.location.href = `/clients/${client._id}`;
      }
    }
  ];

  const handleEdit = (client) => {
    setEditingClient(client);
    clientForm.setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      type: client.type || 'direct',
      status: client.status || 'active',
      address: client.address || '',
      notes: client.notes || ''
    });
    setShowAddClient(true);
  };

  const handleAddClient = () => {
    setEditingClient(null);
    clientForm.reset();
    setShowAddClient(true);
  };

  const handleCloseModal = () => {
    setShowAddClient(false);
    setEditingClient(null);
    clientForm.reset();
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading clients: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client relationships and contact information
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="w-48">
          <Select value={clientType} onValueChange={setClientType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="direct">Direct Clients</SelectItem>
              <SelectItem value="vendor">Vendors</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        title="Client Directory"
        description="Manage your client relationships and contact information"
        data={filteredClients}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search clients by name, email, or phone..."
        onAdd={handleAddClient}
        onEdit={handleEdit}
        onDelete={deleteClient}
        actions={actions}
        addLabel="Add Client"
        emptyMessage="No clients found. Add your first client to get started."
        emptyIcon={Users}
      />

      {/* Client Form Modal */}
      <FormModal
        isOpen={showAddClient}
        onOpenChange={(open) => !open && handleCloseModal()}
        title={editingClient ? 'Edit Client' : 'Add New Client'}
        onSubmit={clientForm.handleSubmit}
        loading={clientForm.isSubmitting}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Full Name"
            name="name"
            value={clientForm.values.name || ''}
            onChange={(e) => clientForm.handleChange('name', e.target.value)}
            error={clientForm.errors.name}
            required
            placeholder="Enter client's full name"
          />
          
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={clientForm.values.email || ''}
            onChange={(e) => clientForm.handleChange('email', e.target.value)}
            error={clientForm.errors.email}
            required
            placeholder="client@example.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Phone"
            name="phone"
            type="tel"
            value={clientForm.values.phone || ''}
            onChange={(e) => clientForm.handleChange('phone', e.target.value)}
            error={clientForm.errors.phone}
            required
            placeholder="+254 700 000 000"
          />
          
          <FormSelect
            label="Client Type"
            name="type"
            value={clientForm.values.type || 'direct'}
            onChange={(e) => clientForm.handleChange('type', e.target.value)}
            error={clientForm.errors.type}
            required
            options={[
              { value: 'direct', label: 'Direct Client' },
              { value: 'vendor', label: 'Vendor' },
              { value: 'corporate', label: 'Corporate' },
              { value: 'individual', label: 'Individual' }
            ]}
          />
        </div>

        <FormInput
          label="Address"
          name="address"
          value={clientForm.values.address || ''}
          onChange={(e) => clientForm.handleChange('address', e.target.value)}
          error={clientForm.errors.address}
          placeholder="Client's address"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Status"
            name="status"
            value={clientForm.values.status || 'active'}
            onChange={(e) => clientForm.handleChange('status', e.target.value)}
            error={clientForm.errors.status}
            required
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' }
            ]}
          />
        </div>

        <FormTextarea
          label="Notes"
          name="notes"
          value={clientForm.values.notes || ''}
          onChange={(e) => clientForm.handleChange('notes', e.target.value)}
          error={clientForm.errors.notes}
          placeholder="Additional notes about the client..."
          rows={3}
        />
      </FormModal>
    </div>
  );
};

export default ClientList;