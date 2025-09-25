import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import DocumentGeneration from './DocumentGeneration';
import AnalyticsCards from './AnalyticsCards';
import OverdueReturnsTable from './OverdueReturnsTable';
import InventoryStatusReport from './InventoryStatusReport';
import FinancialReports from './FinancialReports';

const ReportsTabs = ({
  orders,
  reports,
  selectedOrder,
  setSelectedOrder,
  onGenerateInvoice,
  onGenerateReceipt,
  loading
}) => {
  return (
    <Tabs defaultValue="documents" className="space-y-4">
      <TabsList>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
      </TabsList>

      <TabsContent value="documents" className="space-y-4">
        <DocumentGeneration
          orders={orders}
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          onGenerateInvoice={onGenerateInvoice}
          onGenerateReceipt={onGenerateReceipt}
          loading={loading}
        />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-4">
        <AnalyticsCards orders={orders} reports={reports} />
        <OverdueReturnsTable overdueReturns={reports.overdueReturns} />
      </TabsContent>

      <TabsContent value="inventory" className="space-y-4">
        <InventoryStatusReport inventoryStatus={reports.inventoryStatus} />
      </TabsContent>

      <TabsContent value="financial" className="space-y-4">
        <FinancialReports
          discountApprovals={reports.discountApprovals}
          workerRemuneration={reports.workerRemuneration}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ReportsTabs;
