import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DataTable from '../components/common/DataTable';
import { AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { ordersAPI } from '@/services/api';
import { toast } from 'sonner';


const ViolationsPage = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    totalPenalties: 0
  });

  useEffect(() => {
    loadViolations();
  }, []);

  const loadViolations = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getViolations();
      const violationsData = Array.isArray(response) ? response : response.data || [];
      setViolations(violationsData);
      
      // Calculate stats
      const total = violationsData.length;
      const resolved = violationsData.filter(v => v.resolved).length;
      const pending = total - resolved;
      const totalPenalties = violationsData.reduce((sum, v) => sum + (v.penaltyAmount || 0), 0);
      
      setStats({ total, resolved, pending, totalPenalties });
    } catch (error) {
      console.error('Error loading violations:', error);
      toast.error('Failed to load violations');
      setViolations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveViolation = async (violation) => {
    if (window.confirm(`Are you sure you want to resolve this violation? Penalty: KES ${violation.penaltyAmount?.toLocaleString()}`)) {
      try {
        await ordersAPI.resolveViolation(violation._id);
        toast.success('Violation resolved successfully');
        loadViolations();
      } catch (error) {
        console.error('Error resolving violation:', error);
        toast.error('Failed to resolve violation');
      }
    }
  };

  const getViolationTypeColor = (type) => {
    switch (type) {
      case 'Overdue Return':
        return 'bg-red-100 text-red-800';
      case 'Damaged Item':
        return 'bg-orange-100 text-orange-800';
      case 'Missing Item':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const violationColumns = [
    {
      header: 'Order',
      accessor: 'order',
      render: (order) => (
        <div>
          <div className="font-medium">#{order?._id?.slice(-8) || 'N/A'}</div>
          <div className="text-sm text-gray-500">
            {order?.client?.name || 'Unknown Client'}
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'violationType',
      render: (type) => (
        <Badge className={getViolationTypeColor(type)}>
          {type}
        </Badge>
      )
    },
    {
      header: 'Description',
      accessor: 'description'
    },
    {
      header: 'Penalty Amount',
      accessor: 'penaltyAmount',
      render: (amount) => (
        <div className="font-medium text-red-600">
          KES {amount?.toLocaleString() || '0'}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'resolved',
      render: (resolved, violation) => (
        <div className="flex items-center gap-2">
          {resolved ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Resolved</span>
              {violation.resolvedDate && (
                <div className="text-xs text-gray-500">
                  {new Date(violation.resolvedDate).toLocaleDateString()}
                </div>
              )}
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-orange-600">Pending</span>
            </>
          )}
        </div>
      )
    },
    {
      header: 'Date Created',
      accessor: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (id, violation) => (
        !violation.resolved && (
          <Button
            size="sm"
            onClick={() => handleResolveViolation(violation)}
            className="bg-green-600 hover:bg-green-700"
          >
            Resolve
          </Button>
        )
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading violations...</p>
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Violations</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Penalties</p>
                <p className="text-2xl font-bold text-red-600">
                  KES {stats.totalPenalties.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Violations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Violations</CardTitle>
          <CardDescription>
            Manage rental violations including overdue returns, damaged items, and missing items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={violationColumns}
            data={violations}
            searchable={true}
            searchPlaceholder="Search violations by type, description, client..."
            loading={loading}
            emptyMessage="No violations found. This is good news!"
            emptyIcon={CheckCircle}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ViolationsPage;
