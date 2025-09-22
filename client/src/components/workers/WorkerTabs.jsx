import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import WorkersTable from './WorkersTable';
import AttendanceTable from './AttendanceTable';
import RemunerationSummary from './RemunerationSummary';

const WorkerTabs = ({ 
  workers, 
  attendance, 
  remunerationData, 
  onLoadRemuneration, 
  getWorkerAttendance 
}) => {
  return (
    <Tabs defaultValue="workers" className="space-y-4">
      <TabsList>
        <TabsTrigger value="workers">Workers</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="remuneration">Remuneration</TabsTrigger>
      </TabsList>

      <TabsContent value="workers" className="space-y-4">
        <WorkersTable 
          workers={workers} 
          onLoadRemuneration={onLoadRemuneration} 
        />
      </TabsContent>

      <TabsContent value="attendance" className="space-y-4">
        <AttendanceTable 
          attendance={attendance} 
          workers={workers} 
        />
      </TabsContent>

      <TabsContent value="remuneration" className="space-y-4">
        <RemunerationSummary 
          workers={workers}
          attendance={attendance}
          remunerationData={remunerationData}
          getWorkerAttendance={getWorkerAttendance}
        />
      </TabsContent>
    </Tabs>
  );
};

export default WorkerTabs;
