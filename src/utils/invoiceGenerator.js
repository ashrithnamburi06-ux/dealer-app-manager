import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (order) => {
  const doc = new jsPDF();
  
  // Company Header
  doc.setFontSize(24);
  doc.setTextColor(27, 120, 53); // Green color (#1b7835)
  doc.text('Dealrix', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('Invoice', 105, 30, { align: 'center' });
  
  // Invoice Details
  doc.setFontSize(10);
  doc.setTextColor(60);
  
  const startY = 45;
  const leftCol = 20;
  const rightCol = 120;
  
  doc.text(`Order ID: ${order.id || order.orderId}`, leftCol, startY);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, rightCol, startY);
  
  if (order.paymentId) {
    doc.text(`Payment ID: ${order.paymentId}`, leftCol, startY + 10);
  }
  
  if (order.paidAt) {
    doc.text(`Paid Date: ${new Date(order.paidAt).toLocaleDateString()}`, rightCol, startY + 10);
  }
  
  // Status Badge
  doc.setFontSize(14);
  doc.setTextColor(27, 120, 53);
  doc.text('Status: PAID', 105, startY + 30, { align: 'center' });
  
  // Amount Section
  doc.setFontSize(12);
  doc.setTextColor(60);
  doc.text('Payment Details', 20, startY + 50);
  
  // Table for payment details
  const tableData = [
    ['Description', 'Amount'],
    ['Order Payment', `₹${order.amount?.toLocaleString() || '0'}`],
  ];
  
  autoTable(doc, {
    startY: startY + 55,
    head: [['Description', 'Amount']],
    body: [
      ['Order Payment', `₹${order.amount?.toLocaleString() || '0'}`],
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [27, 120, 53],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 11,
    },
  });
  
  // Total
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(27, 120, 53);
  doc.text(`Total: ₹${order.amount?.toLocaleString() || '0'}`, 140, finalY);
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your payment!', 105, pageHeight - 20, { align: 'center' });
  doc.text('Dealrix - Dealer Distribution Management', 105, pageHeight - 15, { align: 'center' });
  
  // Save PDF
  const fileName = `Invoice_${order.id || order.orderId}_${Date.now()}.pdf`;
  doc.save(fileName);
  
  return fileName;
};
