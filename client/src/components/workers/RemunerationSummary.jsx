import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { DollarSign } from 'lucide-react';

const RemunerationSummary = ({ workers, attendance, remunerationData, getWorkerAttendance }) => {
  if (!Array.isArray(workers) || workers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Remuneration Summary</CardTitle>
          <CardDescription>
            Calculate and view worker payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No workers to calculate remuneration</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Remuneration Summary</CardTitle>
        <CardDescription>
          Calculate and view worker payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {Array.isArray(workers) && workers.map((worker) => {
            const workerAttendance = getWorkerAttendance(worker._id);
            const totalHours = workerAttendance.reduce((sum, att) => sum + (att.hoursWorked || 0), 0);
            const totalAmount = (worker.dailyRate / 8) * totalHours;
            const remuneration = remunerationData[worker._id];
            
            return (
              <Card key={worker._id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{worker.name}</h3>
                      <p className="text-sm text-gray-600">
                        Total Hours: {totalHours}h | Days Worked: {workerAttendance.length}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        KES {totalAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        @ KES {worker.dailyRate}/day
                      </p>
                    </div>
                  </div>
                  {remuneration && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Detailed Breakdown</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>Regular Hours: {remuneration.regularHours}h</div>
                        <div>Overtime Hours: {remuneration.overtimeHours}h</div>
                        <div>Regular Pay: KES {remuneration.regularPay?.toLocaleString()}</div>
                        <div>Overtime Pay: KES {remuneration.overtimePay?.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RemunerationSummary;
