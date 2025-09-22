import React from 'react';
import { Shield } from 'lucide-react';

const AccessDenied = () => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access user management.</p>
        <p className="text-sm text-gray-500 mt-2">Only administrators can manage system users.</p>
      </div>
    </div>
  );
};

export default AccessDenied;
