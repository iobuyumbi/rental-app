import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Users, DollarSign, Edit } from 'lucide-react';

const WorkersTable = ({ workers, onLoadRemuneration }) => {
  if (workers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registered Workers</CardTitle>
          <CardDescription>
            Manage workers and their information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No workers registered yet</p>
            <p className="text-sm text-gray-500">Add your first worker to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registered Workers</CardTitle>
        <CardDescription>
          Manage workers and their information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>National ID</TableHead>
              <TableHead>Daily Rate</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(workers) && workers.map((worker) => (
              <TableRow key={worker._id}>
                <TableCell className="font-medium">{worker.name}</TableCell>
                <TableCell>{worker.phone}</TableCell>
                <TableCell>{worker.nationalId}</TableCell>
                <TableCell>KES {worker.dailyRate?.toLocaleString()}</TableCell>
                <TableCell>
                  {worker.skills && (
                    <Badge variant="outline">{worker.skills}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onLoadRemuneration(worker._id)}
                    >
                      <DollarSign className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default WorkersTable;
