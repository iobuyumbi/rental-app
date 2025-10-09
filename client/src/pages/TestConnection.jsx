import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { workersAPI } from '../services/api';
import { toast } from 'sonner';

const TestConnection = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testWorkerAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing workers API connection...');
      const result = await workersAPI.workers.get();
      console.log('API Response:', result);
      setTestResult(result);
      toast.success('API connection successful!');
    } catch (err) {
      console.error('API Connection Error:', err);
      setError(err.message || 'Unknown error');
      toast.error(`API Error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testAttendanceAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing attendance API connection...');
      const result = await workersAPI.attendance.list();
      console.log('API Response:', result);
      setTestResult(result);
      toast.success('Attendance API connection successful!');
    } catch (err) {
      console.error('API Connection Error:', err);
      setError(err.message || 'Unknown error');
      toast.error(`API Error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Connection Test</h1>
        <p className="text-gray-600">Test the connection to the backend API</p>
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={testWorkerAPI} 
          disabled={loading}
          variant="default"
        >
          {loading ? 'Testing...' : 'Test Workers API'}
        </Button>

        <Button 
          onClick={testAttendanceAPI} 
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Testing...' : 'Test Attendance API'}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {testResult && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-medium text-green-800">Success</h3>
          <p className="text-green-700">API returned {Array.isArray(testResult) ? testResult.length : 1} result(s)</p>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto max-h-60">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestConnection;