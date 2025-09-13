import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Users, Plus, Calendar, DollarSign, Clock, Edit, Trash2, CheckCircle } from 'lucide-react';
import { casualsAPI } from '../services/api';
import { toast } from 'sonner';

const CasualsPage = () => {
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [remunerationData, setRemunerationData] = useState({});
  const [newWorker, setNewWorker] = useState({
    name: '',
    phone: '',
    nationalId: '',
    dailyRate: '',
    skills: ''
  });
  const [attendanceForm, setAttendanceForm] = useState({
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: '',
    taskDescription: '',
    status: 'Present'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workersRes, attendanceRes] = await Promise.all([
        casualsAPI.workers.get(),
        casualsAPI.attendance.list()
      ]);
      setWorkers(workersRes.data || []);
      setAttendance(attendanceRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load casual workers data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      await casualsAPI.workers.create({
        ...newWorker,
        dailyRate: parseFloat(newWorker.dailyRate)
      });
      toast.success('Worker added successfully');
      setShowAddWorker(false);
      setNewWorker({ name: '', phone: '', nationalId: '', dailyRate: '', skills: '' });
      loadData();
    } catch (error) {
      console.error('Error adding worker:', error);
      toast.error('Failed to add worker');
    }
  };

  const handleRecordAttendance = async (e) => {
    e.preventDefault();
    try {
      await casualsAPI.attendance.record({
        ...attendanceForm,
        hoursWorked: parseFloat(attendanceForm.hoursWorked)
      });
      toast.success('Attendance recorded successfully');
      setShowAttendance(false);
      setAttendanceForm({
        workerId: '',
        date: new Date().toISOString().split('T')[0],
        hoursWorked: '',
        taskDescription: '',
        status: 'Present'
      });
      loadData();
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error('Failed to record attendance');
    }
  };

  const loadRemuneration = async (workerId) => {
    try {
      const response = await casualsAPI.remuneration.calculate(workerId);
      setRemunerationData(prev => ({ ...prev, [workerId]: response.data }));
    } catch (error) {
      console.error('Error loading remuneration:', error);
      toast.error('Failed to load remuneration data');
    }
  };

  const getWorkerAttendance = (workerId) => {
    return attendance.filter(att => att.workerId === workerId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading casual workers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Casual Workers</h1>
          <p className="text-gray-600">Manage casual workers and attendance</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAttendance} onOpenChange={setShowAttendance}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Record Attendance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Attendance</DialogTitle>
                <DialogDescription>
                  Record daily attendance for a casual worker
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRecordAttendance} className="space-y-4">
                <div>
                  <Label htmlFor="workerId">Worker</Label>
                  <Select value={attendanceForm.workerId} onValueChange={(value) => setAttendanceForm(prev => ({ ...prev, workerId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select worker" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(workers) && workers.map(worker => (
                        <SelectItem key={worker._id} value={worker._id}>
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={attendanceForm.date}
                    onChange={(e) => setAttendanceForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hoursWorked">Hours Worked</Label>
                  <Input
                    id="hoursWorked"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={attendanceForm.hoursWorked}
                    onChange={(e) => setAttendanceForm(prev => ({ ...prev, hoursWorked: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="taskDescription">Task Description</Label>
                  <Input
                    id="taskDescription"
                    value={attendanceForm.taskDescription}
                    onChange={(e) => setAttendanceForm(prev => ({ ...prev, taskDescription: e.target.value }))}
                    placeholder="Describe the work performed"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={attendanceForm.status} onValueChange={(value) => setAttendanceForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Present">Present</SelectItem>
                      <SelectItem value="Absent">Absent</SelectItem>
                      <SelectItem value="Late">Late</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Record Attendance
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddWorker} onOpenChange={setShowAddWorker}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Worker
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Casual Worker</DialogTitle>
                <DialogDescription>
                  Register a new casual worker in the system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddWorker} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newWorker.name}
                    onChange={(e) => setNewWorker(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newWorker.phone}
                    onChange={(e) => setNewWorker(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nationalId">National ID</Label>
                  <Input
                    id="nationalId"
                    value={newWorker.nationalId}
                    onChange={(e) => setNewWorker(prev => ({ ...prev, nationalId: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dailyRate">Daily Rate (KSH)</Label>
                  <Input
                    id="dailyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newWorker.dailyRate}
                    onChange={(e) => setNewWorker(prev => ({ ...prev, dailyRate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="skills">Skills/Specialization</Label>
                  <Input
                    id="skills"
                    value={newWorker.skills}
                    onChange={(e) => setNewWorker(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="e.g., Cleaning, Setup, Technical"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Worker
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="workers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="remuneration">Remuneration</TabsTrigger>
        </TabsList>

        <TabsContent value="workers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Workers</CardTitle>
              <CardDescription>
                Manage casual workers and their information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No workers registered yet</p>
                  <p className="text-sm text-gray-500">Add your first casual worker to get started</p>
                </div>
              ) : (
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
                        <TableCell>KSH {worker.dailyRate?.toLocaleString()}</TableCell>
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
                              onClick={() => loadRemuneration(worker._id)}
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                View and manage daily attendance records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No attendance records yet</p>
                  <p className="text-sm text-gray-500">Start recording daily attendance</p>
                </div>
              ) : (
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
                          <TableCell>KSH {amount.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remuneration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Remuneration Summary</CardTitle>
              <CardDescription>
                Calculate and view worker payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workers.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No workers to calculate remuneration</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {workers.map((worker) => {
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
                                KSH {totalAmount.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600">
                                @ KSH {worker.dailyRate}/day
                              </p>
                            </div>
                          </div>
                          {remuneration && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium mb-2">Detailed Breakdown</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>Regular Hours: {remuneration.regularHours}h</div>
                                <div>Overtime Hours: {remuneration.overtimeHours}h</div>
                                <div>Regular Pay: KSH {remuneration.regularPay?.toLocaleString()}</div>
                                <div>Overtime Pay: KSH {remuneration.overtimePay?.toLocaleString()}</div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CasualsPage;