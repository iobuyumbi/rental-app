import React from 'react';
import { DollarSign, Calendar } from 'lucide-react';

const TaskTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex space-x-1 mb-6">
      <button
        onClick={() => setActiveTab('rates')}
        className={`px-4 py-2 rounded-lg font-medium ${
          activeTab === 'rates'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <DollarSign className="h-4 w-4 inline mr-2" />
        Task Rates
      </button>
      <button
        onClick={() => setActiveTab('completions')}
        className={`px-4 py-2 rounded-lg font-medium ${
          activeTab === 'completions'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Calendar className="h-4 w-4 inline mr-2" />
        Task Completions
      </button>
    </div>
  );
};

export default TaskTabs;
