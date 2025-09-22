import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Plus, Download, FileText } from 'lucide-react';
import { ordersAPI } from '../services/api';
import { toast } from 'sonner';
import useDataManager from '../hooks/useDataManager';

// Import our new components
import ViolationStatsCards from '../components/violations/ViolationStatsCards';
import ViolationFilters from '../components/violations/ViolationFilters';
import ViolationTable from '../components/violations/ViolationTable';
import ViolationForm from '../components/violations/ViolationForm';
import ViolationDetailsModal from '../components/violations/ViolationDetailsModal';
import ResolveViolationDialog from '../components/violations/ResolveViolationDialog';

const ViolationsPage = () => {
  // State management
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    penaltyRange: 'all',
    dateFrom: null,
    dateTo: null,
    clientId: 'all'
  });

  const [selectedViolations, setSelectedViolations] = useState([]);
  const [showViolationForm, setShowViolationForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [editingViolation, setEditingViolation] = useState(null);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [isBulkResolve, setIsBulkResolve] = useState(false);

  // Use the data manager hook for violations
  const {
    data: violations,
    loading,
    error,
    createItem: createViolation,
    updateItem: updateViolation,
    deleteItem: deleteViolation,
    refresh: refreshViolations
  } = useDataManager({
    fetchFn: () => ordersAPI.getViolations(filters),
    createFn: ordersAPI.createViolation,
    updateFn: ordersAPI.updateViolation,
    deleteFn: ordersAPI.deleteViolation,
    entityName: 'violation',
    autoLoad: true
  });

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = violations.length;
    const resolved = violations.filter(v => v.resolved).length;
    const pending = total - resolved;
    const totalPenalties = violations.reduce((sum, v) => sum + (v.penaltyAmount || 0), 0);
    const paidAmount = violations.reduce((sum, v) => sum + (v.paidAmount || 0), 0);
    
    return {
      total,
      resolved,
      pending,
      totalPenalties,
      paidAmount,
      outstanding: totalPenalties - paidAmount
    };
  }, [violations]);

  // Filter violations based on current filters
  const filteredViolations = React.useMemo(() => {
    return violations.filter(violation => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          violation.description?.toLowerCase().includes(searchLower) ||
          violation.violationType?.toLowerCase().includes(searchLower) ||
          violation.order?.client?.name?.toLowerCase().includes(searchLower) ||
          violation.order?._id?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.type !== 'all' && violation.violationType !== filters.type) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        const isResolved = violation.resolved;
        if (filters.status === 'resolved' && !isResolved) return false;
        if (filters.status === 'pending' && isResolved) return false;
      }

      // Penalty range filter
      if (filters.penaltyRange !== 'all') {
        const amount = violation.penaltyAmount || 0;
        switch (filters.penaltyRange) {
          case '0-1000':
            if (amount > 1000) return false;
            break;
          case '1000-5000':
            if (amount < 1000 || amount > 5000) return false;
            break;
          case '5000-10000':
            if (amount < 5000 || amount > 10000) return false;
            break;
          case '10000+':
            if (amount < 10000) return false;
            break;
        }
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const violationDate = new Date(violation.createdAt);
        if (filters.dateFrom && violationDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && violationDate > new Date(filters.dateTo)) return false;
      }

      return true;
    });
  }, [violations, filters]);

  // Handlers
  const handleAddViolation = () => {
    setEditingViolation(null);
    setShowViolationForm(true);
  };

  const handleEditViolation = (violation) => {
    setEditingViolation(violation);
    setShowViolationForm(true);
  };

  const handleViewViolation = (violation) => {
    setSelectedViolation(violation);
    setShowDetailsModal(true);
  };

  const handleResolveViolation = (violation) => {
    setSelectedViolation(violation);
    setIsBulkResolve(false);
    setShowResolveDialog(true);
  };

  const handleBulkResolve = (violationIds) => {
    setSelectedViolations(violationIds);
    setIsBulkResolve(true);
    setShowResolveDialog(true);
  };

  const handleDeleteViolation = async (violation) => {
    if (window.confirm(`Are you sure you want to delete this ${violation.violationType} violation?`)) {
      try {
        await deleteViolation(violation._id);
        toast.success('Violation deleted successfully');
      } catch (error) {
        toast.error('Failed to delete violation');
      }
    }
  };

  const handleViolationSubmit = async (violationData) => {
    try {
      if (editingViolation) {
        await updateViolation(editingViolation._id, violationData);
        toast.success('Violation updated successfully');
      } else {
        await createViolation(violationData);
        toast.success('Violation created successfully');
      }
      setShowViolationForm(false);
      setEditingViolation(null);
    } catch (error) {
      toast.error(editingViolation ? 'Failed to update violation' : 'Failed to create violation');
    }
  };

  const handleResolveSubmit = async (resolutionData) => {
    try {
      if (isBulkResolve) {
        await ordersAPI.bulkResolveViolations(selectedViolations, resolutionData);
        toast.success(`${selectedViolations.length} violations resolved successfully`);
        setSelectedViolations([]);
      } else {
        await ordersAPI.resolveViolation(selectedViolation._id, resolutionData);
        toast.success('Violation resolved successfully');
      }
      setShowResolveDialog(false);
      setSelectedViolation(null);
      setIsBulkResolve(false);
      refreshViolations();
    } catch (error) {
      toast.error('Failed to resolve violation(s)');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await ordersAPI.exportViolations(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `violations-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Violations exported successfully');
    } catch (error) {
      toast.error('Failed to export violations');
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Close modals
  const closeViolationForm = () => {
    setShowViolationForm(false);
    setEditingViolation(null);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedViolation(null);
  };

  const closeResolveDialog = () => {
    setShowResolveDialog(false);
    setSelectedViolation(null);
    setIsBulkResolve(false);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load violations</p>
          <Button onClick={refreshViolations}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Violations Management</h1>
          <p className="text-gray-600">Track and manage rental violations and penalties</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddViolation}>
            <Plus className="h-4 w-4 mr-2" />
            Add Violation
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <ViolationStatsCards stats={stats} loading={loading} />

      {/* Filters */}
      <ViolationFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
        onRefresh={refreshViolations}
        loading={loading}
      />

      {/* Violations Table */}
      <ViolationTable
        violations={filteredViolations}
        loading={loading}
        selectedViolations={selectedViolations}
        onSelectionChange={setSelectedViolations}
        onResolve={handleResolveViolation}
        onEdit={handleEditViolation}
        onDelete={handleDeleteViolation}
        onView={handleViewViolation}
        onBulkResolve={handleBulkResolve}
        showBulkActions={true}
      />

      {/* Modals */}
      <ViolationForm
        isOpen={showViolationForm}
        onClose={closeViolationForm}
        violation={editingViolation}
        onSubmit={handleViolationSubmit}
        loading={loading}
      />

      <ViolationDetailsModal
        isOpen={showDetailsModal}
        onClose={closeDetailsModal}
        violation={selectedViolation}
        onEdit={handleEditViolation}
        onDelete={handleDeleteViolation}
        onResolve={handleResolveViolation}
        canEdit={true}
      />

      <ResolveViolationDialog
        isOpen={showResolveDialog}
        onClose={closeResolveDialog}
        violation={selectedViolation}
        onResolve={handleResolveSubmit}
        loading={loading}
        isBulkResolve={isBulkResolve}
        violationCount={selectedViolations.length}
      />
    </div>
  );
};

export default ViolationsPage;
