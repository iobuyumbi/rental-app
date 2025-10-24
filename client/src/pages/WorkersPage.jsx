import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { DialogTrigger } from '../components/ui/dialog';
import { Users, Plus, Clock, Briefcase } from 'lucide-react';
import { workersAPI } from '../services/api';
import { toast } from 'sonner';

// Import our components
import WorkerForm from '../components/workers/WorkerForm';
import AttendanceForm from '../components/workers/AttendanceForm';
import WorkerTabs from '../components/workers/WorkerTabs';
import DailyTaskModal from '../components/worker-tasks/DailyTaskModal';

const WorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showDailyTask, setShowDailyTask] = useState(false);
  const [remunerationData, setRemunerationData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newWorker, setNewWorker] = useState({
    name: '',
    phone: '',
    nationalId: '',
    dailyRate: '0',
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
      setError(null);
      const [workersRes, attendanceRes] = await Promise.all([
        workersAPI.workers.get(),
        workersAPI.attendance.list()
      ]);
      
      // Handle different response structures
      const workersData = workersRes?.data || workersRes || [];
      const attendanceData = attendanceRes?.data || attendanceRes || [];
      
      setWorkers(Array.isArray(workersData) ? workersData : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load workers data. Please try again.');
      toast.error('Failed to load workers data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const dailyRate = parseFloat(newWorker.dailyRate);
      await workersAPI.workers.create({
        name: newWorker.name,
        phone: newWorker.phone,
        nationalId: newWorker.nationalId,
        skills: newWorker.skills,
        ratePerHour: dailyRate / 8, // Assuming 8-hour work day
        standardDailyRate: dailyRate,
        dailyRate: dailyRate
      });
      toast.success('Worker added successfully');
      setShowAddWorker(false);
      setNewWorker({ name: '', phone: '', nationalId: '', dailyRate: '0', skills: '' });
      loadData();
    } catch (error) {
      console.error('Error adding worker:', error);
      toast.error('Failed to add worker');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordAttendance = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!workers || workers.length === 0) {
      toast.error('No workers available. Please add workers first.');
      return;
    }
    
    if (!attendanceForm.workerId) {
      toast.error('Please select a worker');
      return;
    }
    
    if (!attendanceForm.hoursWorked || parseFloat(attendanceForm.hoursWorked) <= 0) {
      toast.error('Please enter valid hours worked');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const attendanceData = {
        ...attendanceForm,
        worker: attendanceForm.workerId, // Backend might expect 'worker' field
        hoursWorked: parseFloat(attendanceForm.hoursWorked)
      };
      
      console.log('Submitting attendance data:', attendanceData);
      
      // Record attendance
      await workersAPI.attendance.record(attendanceData);

      // If worker is present, automatically create lunch allowance entry
      if (attendanceForm.status === 'Present') {
        try {
          const lunchAllowanceAPI = (await import('../services/api')).lunchAllowanceAPI;
          await lunchAllowanceAPI.create({
            workerId: attendanceForm.workerId,
            date: attendanceForm.date,
            amount: 100, // Minimum KES 100 as specified
            status: 'provided',
            hoursWorked: parseFloat(attendanceForm.hoursWorked),
            taskDescription: attendanceForm.taskDescription
          });
        } catch (lunchError) {
          console.error('Error creating lunch allowance:', lunchError);
          // Don't fail the whole operation if lunch allowance fails
          toast.warning('Attendance recorded but lunch allowance creation failed');
        }
      }

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
      const errorMessage = error.message || 'Failed to record attendance';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const loadRemuneration = async (workerId) => {
    try {
      const response = await workersAPI.remuneration.calculate(workerId);
      setRemunerationData(prev => ({ ...prev, [workerId]: response.data }));
    } catch (error) {
      console.error('Error loading remuneration:', error);
      toast.error('Failed to load remuneration data');
    }
  };

  const getWorkerAttendance = (workerId) => {
    return attendance.filter(att => att.workerId === workerId);
  };

  const handleWorkerFormChange = (field, value) => {
    setNewWorker(prev => ({ ...prev, [field]: value }));
  };

  const handleAttendanceFormChange = (field, value) => {
    setAttendanceForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDailyTaskCreated = (taskData) => {
    toast.success(`Daily task recorded for ${taskData.workerName}`);
    // Optionally refresh worker data if needed
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading workers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workers Management</h1>
          <p className="text-gray-600">Manage workers, attendance, and daily tasks</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            onClick={() => setShowDailyTask(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Record Daily Task
          </Button>
          <Button variant="outline" onClick={() => setShowAttendance(true)}>
            <Clock className="h-4 w-4 mr-2" />
            Record Attendance
          </Button>
          <Button onClick={() => setShowAddWorker(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Worker
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      <WorkerTabs
        workers={workers}
        attendance={attendance}
        remunerationData={remunerationData}
        onLoadRemuneration={loadRemuneration}
        getWorkerAttendance={getWorkerAttendance}
      />

      <WorkerForm
        isOpen={showAddWorker}
        onClose={setShowAddWorker}
        onSubmit={handleAddWorker}
        formData={newWorker}
        onFormChange={handleWorkerFormChange}
        loading={submitting}
      />

      <AttendanceForm
        isOpen={showAttendance}
        onClose={setShowAttendance}
        onSubmit={handleRecordAttendance}
        formData={attendanceForm}
        onFormChange={handleAttendanceFormChange}
        workers={workers}
        loading={submitting}
      />

      {/* Daily Task Modal */}
      <DailyTaskModal
        isOpen={showDailyTask}
        onClose={() => setShowDailyTask(false)}
        onTaskCreated={handleDailyTaskCreated}
      />
    </div>
  );
};

export default WorkersPage;
