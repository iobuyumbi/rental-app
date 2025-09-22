import React, { useState } from 'react';
import { ordersAPI } from '../../services/api';
import { toast } from 'sonner';

const ClientTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testClientCreation = async () => {
    setLoading(true);
    setResult(null);
    
    const testClient = {
      name: 'Test Company Ltd',
      contactPerson: 'John Doe',
      email: 'test@company.com',
      phone: '+254700000000',
      address: '123 Test Street, Nairobi',
      type: 'direct',
      status: 'active',
      notes: 'This is a test client'
    };

    console.log('Testing client creation with data:', testClient);
    console.log('Auth token exists:', !!localStorage.getItem('token'));

    try {
      const response = await ordersAPI.addClient(testClient);
      console.log('Client creation successful:', response);
      setResult({ success: true, data: response });
      toast.success('Test client created successfully!');
    } catch (error) {
      console.error('Client creation failed:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      setResult({ success: false, error: error.message });
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetClients = async () => {
    setLoading(true);
    setResult(null);

    try {
      const clients = await ordersAPI.getClients();
      console.log('Get clients successful:', clients);
      setResult({ success: true, data: clients, type: 'getClients' });
      toast.success(`Found ${clients.length} clients`);
    } catch (error) {
      console.error('Get clients failed:', error);
      setResult({ success: false, error: error.message });
      toast.error(`Get clients failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Client API Test</h2>
      
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={testGetClients}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Get Clients'}
          </button>
          
          <button
            onClick={testClientCreation}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Create Client'}
          </button>
        </div>

        {result && (
          <div className={`p-4 rounded ${result.success ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'} border`}>
            <h3 className="font-bold">{result.success ? 'Success!' : 'Error!'}</h3>
            <pre className="mt-2 text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>Auth Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
          <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</p>
        </div>
      </div>
    </div>
  );
};

export default ClientTest;
