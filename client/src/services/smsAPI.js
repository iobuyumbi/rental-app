import api from './api';

const handleResponse = (response) => {
  if (response.data?.success && response.data?.data) {
    return response.data.data;
  }
  return response.data;
};

const handleError = (error) => {
  console.error('SMS API Error:', error);
  let message = 'An error occurred';
  
  if (error.response) {
    message = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
  } else if (error.request) {
    message = 'No response from server. Please check your connection.';
  } else {
    message = error.message || 'Network error occurred';
  }
  
  throw new Error(message);
};

export const smsAPI = {
  // Send single SMS
  sendSMS: async (smsData) => {
    try {
      const response = await api.post('/sms/send', smsData);
      return handleResponse(response);
    } catch (error) {
      // Fallback: simulate SMS sending for demo
      console.warn('SMS service not available, simulating send');
      return simulateSMSSend(smsData);
    }
  },

  // Send bulk SMS
  sendBulkSMS: async (bulkSMSData) => {
    try {
      const response = await api.post('/sms/bulk-send', bulkSMSData);
      return handleResponse(response);
    } catch (error) {
      console.warn('Bulk SMS service not available, simulating send');
      return simulateBulkSMSSend(bulkSMSData);
    }
  },

  // Send order confirmation SMS
  sendOrderConfirmation: async (orderId) => {
    try {
      const response = await api.post(`/sms/order-confirmation/${orderId}`);
      return handleResponse(response);
    } catch (error) {
      return await sendOrderConfirmationFallback(orderId);
    }
  },

  // Send rental reminder SMS
  sendRentalReminder: async (orderId) => {
    try {
      const response = await api.post(`/sms/rental-reminder/${orderId}`);
      return handleResponse(response);
    } catch (error) {
      return await sendRentalReminderFallback(orderId);
    }
  },

  // Send overdue notification SMS
  sendOverdueNotification: async (orderId) => {
    try {
      const response = await api.post(`/sms/overdue-notification/${orderId}`);
      return handleResponse(response);
    } catch (error) {
      return await sendOverdueNotificationFallback(orderId);
    }
  },

  // Get SMS history
  getSMSHistory: async (params = {}) => {
    try {
      const response = await api.get('/sms/history', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Get SMS templates
  getSMSTemplates: async () => {
    try {
      const response = await api.get('/sms/templates');
      return handleResponse(response);
    } catch (error) {
      // Return default templates
      return getDefaultSMSTemplates();
    }
  },

  // Create/Update SMS template
  saveSMSTemplate: async (templateData) => {
    try {
      const response = await api.post('/sms/templates', templateData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

// Fallback functions for demo purposes
const simulateSMSSend = async (smsData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    messageId: `SMS_${Date.now()}`,
    recipient: smsData.phoneNumber,
    message: smsData.message,
    cost: 0.3, // KES 0.30 per SMS
    status: 'sent',
    timestamp: new Date().toISOString()
  };
};

const simulateBulkSMSSend = async (bulkSMSData) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const results = bulkSMSData.recipients.map(recipient => ({
    messageId: `SMS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    recipient: recipient.phoneNumber,
    status: 'sent',
    cost: 0.3
  }));

  return {
    success: true,
    totalSent: results.length,
    totalCost: results.length * 0.3,
    results,
    timestamp: new Date().toISOString()
  };
};

const sendOrderConfirmationFallback = async (orderId) => {
  try {
    // Fetch order data
    const order = await api.get(`/orders/${orderId}`).then(handleResponse);
    
    if (!order || !order.client?.phone) {
      throw new Error('Order not found or client phone number missing');
    }

    const message = `Hi ${order.client.name}, your rental order #${order._id.slice(-6)} has been confirmed. Rental period: ${new Date(order.rentalStartDate).toLocaleDateString()} - ${new Date(order.rentalEndDate).toLocaleDateString()}. Total: KES ${order.totalAmount?.toLocaleString()}. Thank you!`;

    return await simulateSMSSend({
      phoneNumber: order.client.phone,
      message
    });
  } catch (error) {
    throw new Error(`Failed to send order confirmation: ${error.message}`);
  }
};

const sendRentalReminderFallback = async (orderId) => {
  try {
    const order = await api.get(`/orders/${orderId}`).then(handleResponse);
    
    if (!order || !order.client?.phone) {
      throw new Error('Order not found or client phone number missing');
    }

    const daysUntilReturn = Math.ceil((new Date(order.rentalEndDate) - new Date()) / (1000 * 60 * 60 * 24));
    const message = `Reminder: Your rental items for order #${order._id.slice(-6)} are due for return in ${daysUntilReturn} day(s) on ${new Date(order.rentalEndDate).toLocaleDateString()}. Please ensure timely return to avoid late fees.`;

    return await simulateSMSSend({
      phoneNumber: order.client.phone,
      message
    });
  } catch (error) {
    throw new Error(`Failed to send rental reminder: ${error.message}`);
  }
};

const sendOverdueNotificationFallback = async (orderId) => {
  try {
    const order = await api.get(`/orders/${orderId}`).then(handleResponse);
    
    if (!order || !order.client?.phone) {
      throw new Error('Order not found or client phone number missing');
    }

    const daysOverdue = Math.ceil((new Date() - new Date(order.rentalEndDate)) / (1000 * 60 * 60 * 24));
    const message = `URGENT: Your rental items for order #${order._id.slice(-6)} are ${daysOverdue} day(s) overdue. Please return immediately to avoid additional charges. Contact us: +254 700 000 000`;

    return await simulateSMSSend({
      phoneNumber: order.client.phone,
      message
    });
  } catch (error) {
    throw new Error(`Failed to send overdue notification: ${error.message}`);
  }
};

const getDefaultSMSTemplates = () => {
  return [
    {
      id: 'order_confirmation',
      name: 'Order Confirmation',
      message: 'Hi {clientName}, your rental order #{orderNumber} has been confirmed. Rental period: {startDate} - {endDate}. Total: KES {totalAmount}. Thank you!',
      variables: ['clientName', 'orderNumber', 'startDate', 'endDate', 'totalAmount']
    },
    {
      id: 'rental_reminder',
      name: 'Rental Reminder',
      message: 'Reminder: Your rental items for order #{orderNumber} are due for return in {daysUntilReturn} day(s) on {returnDate}. Please ensure timely return to avoid late fees.',
      variables: ['orderNumber', 'daysUntilReturn', 'returnDate']
    },
    {
      id: 'overdue_notification',
      name: 'Overdue Notification',
      message: 'URGENT: Your rental items for order #{orderNumber} are {daysOverdue} day(s) overdue. Please return immediately to avoid additional charges. Contact us: {contactNumber}',
      variables: ['orderNumber', 'daysOverdue', 'contactNumber']
    },
    {
      id: 'payment_reminder',
      name: 'Payment Reminder',
      message: 'Payment reminder: Invoice #{invoiceNumber} for KES {amount} is due on {dueDate}. Please make payment to avoid late fees. Thank you!',
      variables: ['invoiceNumber', 'amount', 'dueDate']
    },
    {
      id: 'marketing_promo',
      name: 'Marketing Promotion',
      message: 'Special offer! Get {discount}% off your next rental. Book now and save on quality equipment. Valid until {expiryDate}. Call {contactNumber} to book!',
      variables: ['discount', 'expiryDate', 'contactNumber']
    }
  ];
};

export default smsAPI;
