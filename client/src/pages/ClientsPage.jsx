import React from 'react';
import ClientList from '../components/clients/ClientList';
import ClientTest from '../components/clients/ClientTest';

const ClientsPage = () => {
  return (
    <div className="space-y-6">
      <ClientTest />
      <ClientList />
    </div>
  );
};

export default ClientsPage;
