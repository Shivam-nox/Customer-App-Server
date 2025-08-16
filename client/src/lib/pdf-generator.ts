import jsPDF from 'jspdf';
import type { Order, User } from '@shared/schema';

interface InvoiceData {
  order: Order;
  user: User;
  payment?: {
    transactionId?: string;
    method: string;
  };
}

export function generateInvoicePDF(data: InvoiceData): Uint8Array {
  const { order, user, payment } = data;
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header with company branding
  doc.setFillColor(25, 118, 210); // Primary blue color
  doc.rect(0, 0, 210, 30, 'F');
  
  // Company logo area and name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ZAPYGO', 20, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Doorstep Diesel Delivery', 20, 26);
  
  // Invoice title and details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 150, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${order.orderNumber}`, 150, 52);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 150, 58);
  
  if (payment?.transactionId) {
    doc.text(`Transaction ID: ${payment.transactionId}`, 150, 64);
  }
  
  // Customer details section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 75);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const customerName = user.businessName || user.name || 'N/A';
  doc.text(customerName, 20, 83);
  
  if (user.phone) {
    doc.text(`Phone: ${user.phone}`, 20, 90);
  }
  
  if (user.email) {
    doc.text(`Email: ${user.email}`, 20, 97);
  }
  
  if (user.businessAddress) {
    doc.text(`Business Address:`, 20, 104);
    // Handle long addresses by wrapping text
    const addressLines = doc.splitTextToSize(user.businessAddress, 80);
    doc.text(addressLines, 20, 111);
  }
  
  // Delivery details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Delivery Details:', 20, 130);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Delivery Address:', 20, 138);
  const deliveryLines = doc.splitTextToSize(order.deliveryAddress, 80);
  doc.text(deliveryLines, 20, 145);
  
  doc.text(`Scheduled Date: ${new Date(order.scheduledDate).toLocaleDateString('en-IN')}`, 20, 160);
  doc.text(`Scheduled Time: ${order.scheduledTime}`, 20, 167);
  
  // Items table
  const tableStartY = 185;
  
  // Table headers
  doc.setFillColor(240, 240, 240);
  doc.rect(20, tableStartY, 170, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 25, tableStartY + 7);
  doc.text('Qty', 90, tableStartY + 7);
  doc.text('Rate', 110, tableStartY + 7);
  doc.text('Amount', 150, tableStartY + 7);
  
  // Table border
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, tableStartY, 170, 10);
  
  // Items
  doc.setFont('helvetica', 'normal');
  let currentY = tableStartY + 20;
  
  // Diesel fuel line item
  doc.text('Diesel Fuel', 25, currentY);
  doc.text(`${order.quantity}L`, 90, currentY);
  doc.text(`₹${parseFloat(order.ratePerLiter).toFixed(2)}`, 110, currentY);
  doc.text(`₹${parseFloat(order.subtotal).toLocaleString('en-IN')}`, 150, currentY);
  
  currentY += 10;
  
  // Delivery charges
  doc.text('Delivery Charges', 25, currentY);
  doc.text('1', 90, currentY);
  doc.text(`₹${parseFloat(order.deliveryCharges).toFixed(2)}`, 110, currentY);
  doc.text(`₹${parseFloat(order.deliveryCharges).toFixed(2)}`, 150, currentY);
  
  currentY += 10;
  
  // GST
  doc.text('GST (18%)', 25, currentY);
  doc.text('-', 90, currentY);
  doc.text('-', 110, currentY);
  doc.text(`₹${parseFloat(order.gst).toLocaleString('en-IN')}`, 150, currentY);
  
  currentY += 15;
  
  // Total line
  doc.setDrawColor(0, 0, 0);
  doc.line(20, currentY - 5, 190, currentY - 5);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Amount:', 110, currentY);
  doc.text(`₹${parseFloat(order.totalAmount).toLocaleString('en-IN')}`, 150, currentY);
  
  // Payment information
  if (payment) {
    currentY += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information:', 20, currentY);
    
    doc.setFont('helvetica', 'normal');
    currentY += 8;
    doc.text(`Payment Method: ${payment.method.toUpperCase()}`, 20, currentY);
    
    if (payment.transactionId) {
      currentY += 6;
      doc.text(`Transaction ID: ${payment.transactionId}`, 20, currentY);
    }
    
    currentY += 6;
    doc.text('Payment Status: COMPLETED', 20, currentY);
  }
  
  // Footer
  const footerY = 270;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  doc.text('Thank you for choosing Zapygo!', 20, footerY);
  doc.text('For support, contact: support@zapygo.com | +91 1800-123-4567', 20, footerY + 6);
  
  // Company address footer
  doc.text('Zapygo Technologies Pvt Ltd, Business Registration No: U12345AB2024PTC123456', 20, footerY + 12);
  doc.text('GST No: 27ABCDE1234F1Z5 | CIN: U12345AB2024PTC123456', 20, footerY + 18);
  
  // Terms and conditions
  doc.setFontSize(7);
  doc.text('Terms & Conditions: Payment is due upon delivery. All sales are final.', 20, footerY + 26);
  doc.text('This is a computer-generated invoice and does not require a signature.', 20, footerY + 30);
  
  return new Uint8Array(doc.output('arraybuffer'));
}

export function downloadInvoicePDF(data: InvoiceData, filename?: string) {
  const pdfBytes = generateInvoicePDF(data);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename || `invoice-${data.order.orderNumber}.pdf`;
  
  document.body.appendChild(a);
  a.click();
  
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function viewInvoicePDF(data: InvoiceData) {
  const pdfBytes = generateInvoicePDF(data);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  
  window.open(url, '_blank');
  
  // Clean up after a delay to allow the PDF to load
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}
