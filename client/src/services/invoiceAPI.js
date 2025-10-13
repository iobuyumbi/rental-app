import api from './api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const handleResponse = (response) => {
  if (response.data?.success && response.data?.data) {
    return response.data.data;
  }
  return response.data;
};

const handleError = (error) => {
  console.error('Invoice API Error:', error);
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

export const invoiceAPI = {
  // Generate invoice for an order
  generateInvoice: async (orderId) => {
    try {
      const response = await api.get(`/invoices/generate/${orderId}`);
      return handleResponse(response);
    } catch (error) {
      // Fallback: generate invoice client-side
      console.warn('Server invoice generation not available, generating client-side');
      return await generateInvoiceClientSide(orderId);
    }
  },

  // Generate PDF invoice
  generatePDFInvoice: async (orderId) => {
    try {
      const invoiceData = await invoiceAPI.generateInvoice(orderId);
      return generatePDFFromData(invoiceData);
    } catch (error) {
      throw new Error(`Failed to generate PDF invoice: ${error.message}`);
    }
  },

  // Send invoice via email (future implementation)
  sendInvoiceEmail: async (orderId, emailData) => {
    try {
      const response = await api.post(`/invoices/${orderId}/send`, emailData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Get invoice history
  getInvoiceHistory: async (params = {}) => {
    try {
      const response = await api.get('/invoices', { params });
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

// Client-side invoice generation fallback
const generateInvoiceClientSide = async (orderId) => {
  try {
    // Fetch order data
    const order = await api.get(`/orders/${orderId}`).then(handleResponse);
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    // Calculate totals
    const subtotal = order.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || order.totalAmount || 0;
    const tax = subtotal * 0.16; // 16% VAT for Kenya
    const total = subtotal + tax;

    const invoiceData = {
      invoiceNumber,
      orderId: order._id,
      client: order.client,
      items: order.items || [],
      subtotal,
      tax,
      total,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      status: 'pending',
      rentalPeriod: {
        startDate: order.rentalStartDate,
        endDate: order.rentalEndDate
      },
      notes: order.notes || '',
      paymentTerms: '30 days net'
    };

    return invoiceData;
  } catch (error) {
    throw new Error(`Failed to generate invoice: ${error.message}`);
  }
};

// Generate PDF from invoice data
const generatePDFFromData = (invoiceData) => {
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('RENTAL INVOICE', 20, 30);
  
  // Company details (right side)
  doc.setFontSize(10);
  doc.text('Your Rental Company', 140, 30);
  doc.text('123 Business Street', 140, 37);
  doc.text('Nairobi, Kenya', 140, 44);
  doc.text('Phone: +254 700 000 000', 140, 51);
  doc.text('Email: info@rental.com', 140, 58);
  
  // Invoice details
  doc.setFontSize(12);
  doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, 60);
  doc.text(`Order #: ${invoiceData.orderId?.slice(-8) || 'N/A'}`, 20, 70);
  doc.text(`Issue Date: ${new Date(invoiceData.issueDate).toLocaleDateString()}`, 20, 80);
  doc.text(`Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}`, 20, 90);
  
  // Client details
  doc.text('Bill To:', 20, 110);
  doc.text(invoiceData.client?.name || 'Client Name', 20, 120);
  if (invoiceData.client?.email) {
    doc.text(invoiceData.client.email, 20, 130);
  }
  if (invoiceData.client?.phone) {
    doc.text(invoiceData.client.phone, 20, 140);
  }
  if (invoiceData.client?.address) {
    doc.text(invoiceData.client.address, 20, 150);
  }
  
  // Rental period
  if (invoiceData.rentalPeriod) {
    doc.text('Rental Period:', 120, 110);
    doc.text(`From: ${new Date(invoiceData.rentalPeriod.startDate).toLocaleDateString()}`, 120, 120);
    doc.text(`To: ${new Date(invoiceData.rentalPeriod.endDate).toLocaleDateString()}`, 120, 130);
  }
  
  // Items table
  const tableData = invoiceData.items.map(item => [
    item.product?.name || item.name || 'Item',
    item.quantity || 1,
    `KES ${(item.unitPrice || 0).toLocaleString()}`,
    `KES ${(item.totalPrice || 0).toLocaleString()}`
  ]);
  
  doc.autoTable({
    startY: 170,
    head: [['Item', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10 }
  });
  
  // Totals
  const finalY = doc.lastAutoTable.finalY + 20;
  doc.text(`Subtotal: KES ${invoiceData.subtotal.toLocaleString()}`, 140, finalY);
  doc.text(`VAT (16%): KES ${invoiceData.tax.toLocaleString()}`, 140, finalY + 10);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(`Total: KES ${invoiceData.total.toLocaleString()}`, 140, finalY + 25);
  
  // Payment terms
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Payment Terms: 30 days net', 20, finalY + 40);
  doc.text('Thank you for your business!', 20, finalY + 55);
  
  return doc;
};

export default invoiceAPI;
