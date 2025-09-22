import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Calendar } from 'lucide-react';

const AttendanceTable = ({ attendance, workers }) => {
  if (attendance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            View and manage daily attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No attendance records yet</p>
            <p className="text-sm text-gray-500">Start recording daily attendance</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Records</CardTitle>
        <CardDescription>
          View and manage daily attendance records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(attendance) && attendance.map((record) => {
              const worker = workers.find(w => w._id === record.workerId);
              const amount = worker ? (worker.dailyRate * (record.hoursWorked / 8)) : 0;
              return (
                <TableRow key={record._id}>
                  <TableCell className="font-medium">
                    {worker?.name || 'Unknown Worker'}
                  </TableCell>
                  <TableCell>
                    {new Date(record.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{record.hoursWorked}h</TableCell>
                  <TableCell>{record.taskDescription}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={record.status === 'Present' ? 'default' : 
                             record.status === 'Late' ? 'secondary' : 'destructive'}
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>KES {amount.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AttendanceTable;
