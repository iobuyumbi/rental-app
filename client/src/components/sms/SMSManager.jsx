import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Phone,
  DollarSign,
  Calendar,
  Plus,
  History
} from 'lucide-react';
import { smsAPI } from '../../services/smsAPI';
import { ordersAPI } from '../../services/api';
import { toast } from 'sonner';

const SMSManager = () => {
  const [activeTab, setActiveTab] = useState('send');
  const [smsData, setSmsData] = useState({
    phoneNumber: '',
    message: '',
    template: ''
  });
  const [bulkSMSData, setBulkSMSData] = useState({
    recipients: [],
    message: '',
    template: ''
  });
  const [templates, setTemplates] = useState([]);
  const [smsHistory, setSmsHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState('');

  useEffect(() => {
    loadTemplates();
    loadSMSHistory();
    loadOrders();
  }, []);

  const loadTemplates = async () => {
    try {
      const templatesData = await smsAPI.getSMSTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadSMSHistory = async () => {
    try {
      const history = await smsAPI.getSMSHistory({ limit: 50 });
      setSmsHistory(history || []);
    } catch (error) {
      console.error('Error loading SMS history:', error);
      setSmsHistory([]);
    }
  };

  const loadOrders = async () => {
    try {
      const ordersData = await ordersAPI.getOrders();
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleSendSMS = async () => {
    if (!smsData.phoneNumber || !smsData.message) {
      toast.error('Please enter phone number and message');
      return;
    }

    try {
      setLoading(true);
      const result = await smsAPI.sendSMS(smsData);
      toast.success(`SMS sent successfully! Cost: KES ${result.cost}`);
      setSmsData({ phoneNumber: '', message: '', template: '' });
      loadSMSHistory();
    } catch (error) {
      toast.error(`Failed to send SMS: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulkSMS = async () => {
    if (bulkSMSData.recipients.length === 0 || !bulkSMSData.message) {
      toast.error('Please add recipients and message');
      return;
    }

    try {
      setLoading(true);
      const result = await smsAPI.sendBulkSMS(bulkSMSData);
      toast.success(`Bulk SMS sent to ${result.totalSent} recipients! Total cost: KES ${result.totalCost}`);
      setBulkSMSData({ recipients: [], message: '', template: '' });
      loadSMSHistory();
    } catch (error) {
      toast.error(`Failed to send bulk SMS: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOrderNotification = async (type) => {
    if (!selectedOrder) {
      toast.error('Please select an order');
      return;
    }

    try {
      setLoading(true);
      let result;
      
      switch (type) {
        case 'confirmation':
          result = await smsAPI.sendOrderConfirmation(selectedOrder);
          break;
        case 'reminder':
          result = await smsAPI.sendRentalReminder(selectedOrder);
          break;
        case 'overdue':
          result = await smsAPI.sendOverdueNotification(selectedOrder);
          break;
        default:
          throw new Error('Invalid notification type');
      }

      toast.success(`${type} SMS sent successfully! Cost: KES ${result.cost}`);
      loadSMSHistory();
    } catch (error) {
      toast.error(`Failed to send ${type} SMS: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId, isForBulk = false) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      if (isForBulk) {
        setBulkSMSData(prev => ({ ...prev, message: template.message, template: templateId }));
      } else {
        setSmsData(prev => ({ ...prev, message: template.message, template: templateId }));
      }
    }
  };

  const addBulkRecipient = () => {
    const phoneNumber = document.getElementById('bulk-phone').value;
    const name = document.getElementById('bulk-name').value;
    
    if (!phoneNumber) {
      toast.error('Please enter phone number');
      return;
    }

    setBulkSMSData(prev => ({
      ...prev,
      recipients: [...prev.recipients, { phoneNumber, name: name || phoneNumber }]
    }));

    document.getElementById('bulk-phone').value = '';
    document.getElementById('bulk-name').value = '';
  };

  const removeBulkRecipient = (index) => {
    setBulkSMSData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">SMS Management</h1>
        <p className="text-gray-600 mt-1">Send notifications and manage SMS communications</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'send', label: 'Send SMS', icon: Send },
          { id: 'bulk', label: 'Bulk SMS', icon: Users },
          { id: 'notifications', label: 'Order Notifications', icon: Calendar },
          { id: 'history', label: 'History', icon: History }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Send Single SMS */}
      {activeTab === 'send' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Single SMS
            </CardTitle>
            <CardDescription>
              Send SMS to individual recipients. Cost: KES 0.30 per SMS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+254 700 000 000"
                  value={smsData.phoneNumber}
                  onChange={(e) => setSmsData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template">Template (Optional)</Label>
                <Select onValueChange={(value) => handleTemplateSelect(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message here..."
                value={smsData.message}
                onChange={(e) => setSmsData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
              <div className="text-sm text-gray-500">
                {smsData.message.length}/160 characters
              </div>
            </div>

            <Button onClick={handleSendSMS} disabled={loading} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send SMS'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bulk SMS */}
      {activeTab === 'bulk' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bulk SMS
            </CardTitle>
            <CardDescription>
              Send SMS to multiple recipients. Cost: KES 0.30 per SMS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Recipients */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Add Recipients</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  id="bulk-phone"
                  placeholder="Phone number"
                />
                <Input
                  id="bulk-name"
                  placeholder="Name (optional)"
                />
                <Button onClick={addBulkRecipient} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            {/* Recipients List */}
            {bulkSMSData.recipients.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">
                  Recipients ({bulkSMSData.recipients.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {bulkSMSData.recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div>
                        <span className="font-medium">{recipient.name}</span>
                        <span className="text-gray-600 ml-2">{recipient.phoneNumber}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBulkRecipient(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Total cost: KES {(bulkSMSData.recipients.length * 0.3).toFixed(2)}
                </div>
              </div>
            )}

            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Template (Optional)</Label>
              <Select onValueChange={(value) => handleTemplateSelect(value, true)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="bulk-message">Message</Label>
              <Textarea
                id="bulk-message"
                placeholder="Enter your message here..."
                value={bulkSMSData.message}
                onChange={(e) => setBulkSMSData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSendBulkSMS} 
              disabled={loading || bulkSMSData.recipients.length === 0} 
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : `Send to ${bulkSMSData.recipients.length} Recipients`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Order Notifications */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Order Notifications
            </CardTitle>
            <CardDescription>
              Send automated notifications for specific orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Order</Label>
              <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.slice(0, 20).map(order => (
                    <SelectItem key={order._id} value={order._id}>
                      #{order._id.slice(-6)} - {order.client?.name} - KES {order.totalAmount?.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => handleSendOrderNotification('confirmation')}
                disabled={loading || !selectedOrder}
                variant="outline"
                className="h-20 flex-col gap-2"
              >
                <CheckCircle className="h-6 w-6" />
                Order Confirmation
              </Button>

              <Button
                onClick={() => handleSendOrderNotification('reminder')}
                disabled={loading || !selectedOrder}
                variant="outline"
                className="h-20 flex-col gap-2"
              >
                <Clock className="h-6 w-6" />
                Rental Reminder
              </Button>

              <Button
                onClick={() => handleSendOrderNotification('overdue')}
                disabled={loading || !selectedOrder}
                variant="outline"
                className="h-20 flex-col gap-2"
              >
                <AlertTriangle className="h-6 w-6" />
                Overdue Notice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SMS History */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              SMS History
            </CardTitle>
            <CardDescription>
              Recent SMS messages sent from the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {smsHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No SMS history available</p>
                </div>
              ) : (
                smsHistory.map((sms, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="font-medium">{sms.recipient}</div>
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {sms.message}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(sms.status)}>
                        {getStatusIcon(sms.status)}
                        {sms.status}
                      </Badge>
                      <div className="text-sm text-gray-600 mt-1">
                        KES {sms.cost}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SMSManager;
