import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import DataTable from '../common/DataTable';
import useDataManager from '../../hooks/useDataManager';
import { authAPI } from '../../services/api';

const ClientList = () => {
  const [clientType, setClientType] = useState('all');

  // Use the new data manager hook
  const {
    data: clients,
    loading,
    error
  } = useDataManager({
    fetchFn: authAPI.users.get, // Assuming clients are managed through users API
    entityName: 'client',
    autoLoad: true
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
      render: (client) => (
        <span className="capitalize">{client.type || 'N/A'}</span>
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
    // Navigate to edit page
    window.location.href = `/clients/${client._id}/edit`;
  };

  const handleAddClient = () => {
    // Navigate to add client page
    window.location.href = '/clients/new';
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
        <Button onClick={handleAddClient}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
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
        data={filteredClients}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search clients by name, email, or phone..."
        onEdit={handleEdit}
        actions={actions}
        emptyMessage="No clients found. Add your first client to get started."
        emptyIcon={Users}
      />
    </div>
  );
};

export default ClientList;