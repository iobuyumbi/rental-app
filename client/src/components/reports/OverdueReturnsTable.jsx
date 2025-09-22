import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { CheckCircle, Eye } from 'lucide-react';

const OverdueReturnsTable = ({ overdueReturns }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overdue Returns</CardTitle>
        <CardDescription>
          Orders that are past their return date
        </CardDescription>
      </CardHeader>
      <CardContent>
        {overdueReturns.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-gray-600">No overdue returns</p>
            <p className="text-sm text-gray-500">All orders are returned on time</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(overdueReturns) && overdueReturns.map((order) => {
                const daysOverdue = Math.floor((new Date() - new Date(order.returnDate)) / (1000 * 60 * 60 * 24));
                return (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                    <TableCell>{order.clientName}</TableCell>
                    <TableCell>{new Date(order.returnDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{daysOverdue} days</Badge>
                    </TableCell>
                    <TableCell>KES {order.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default OverdueReturnsTable;
