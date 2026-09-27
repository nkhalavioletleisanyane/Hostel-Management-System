import React, { useState } from 'react';
import Modal from './Modal';
import type { FeeInvoice, Student } from '../../types';
import { Printer, Download, Paperclip, FileText, CheckCircle2, RotateCcw, Building, ShieldCheck } from 'lucide-react';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: FeeInvoice | null;
  student?: Student | null;
  allStudents?: Student[];
  isAdmin?: boolean;
  onRollbackPayment?: (invoice: FeeInvoice) => void;
}

// Convert amount in numbers to words (Indian Numbering Format)
export function amountInWords(num: number): string {
  if (!num || num <= 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertGroup = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  };

  let n = Math.floor(num);
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remainder = n;

  let words = '';
  if (crore) words += convertGroup(crore) + ' Crore ';
  if (lakh) words += convertGroup(lakh) + ' Lakh ';
  if (thousand) words += convertGroup(thousand) + ' Thousand ';
  if (remainder) words += convertGroup(remainder) + ' ';

  return words.trim() + ' Rupees Only';
}

// Helper to format ISO dates to standard readable dates (e.g. 11 Aug 2024)
export function formatReceiptDate(dateStr?: string): string {
  if (!dateStr || dateStr === '—') return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (months[monthIdx]) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch {
    // fallback to original string
  }
  return dateStr;
}

// Category descriptions for the itemized particulars
function getCategoryDescription(category: string): string {
  switch (category) {
    case 'Hostel Sem Fee':
      return 'Hostel Accommodation, Room Allocation & Common Facility Maintenance';
    case 'Mess Fee':
      return 'Student Dining Hall, Catering Services & Daily Meal Subscription';
    case 'Electricity':
      return 'Room Utility, Power Consumption & Electrical Infrastructure Surcharge';
    case 'Security Deposit':
      return 'Institutional Hostel Caution & Security Deposit (Refundable)';
    default:
      return 'Campus Hostel Amenities, Maintenance & Administrative Fee';
  }
}

// Generate the isolated, single-page print HTML for printing / PDF saving
export function generateReceiptPrintHtml(invoice: FeeInvoice, student?: Student | null): string {
  const amount = invoice.paidAmount || invoice.amount;
  const inWords = amountInWords(amount);
  const formattedPaidDate = formatReceiptDate(invoice.paidDate || invoice.issueDate);
  const formattedDueDate = formatReceiptDate(invoice.dueDate);
  const receiptNo = `RCP-${invoice.invoiceNo.replace('INV-', '')}`;
  const particularsDesc = getCategoryDescription(invoice.category);
  const roomInfo = student?.roomNumber 
    ? `${student.blockName || 'Hostel'} · Room ${student.roomNumber}` 
    : 'Campus Residence';
  const studentRoll = student?.rollNumber || student?.studentId || invoice.studentId || '—';
  const courseInfo = student?.course ? `${student.course} ${student.semester ? `(${student.semester})` : ''}` : 'Enrolled Student';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt_${invoice.invoiceNo}_${invoice.studentName.replace(/\\s+/g, '_')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-size: 11.5px;
      line-height: 1.35;
    }
    .page-wrapper {
      max-width: 740px;
      margin: 0 auto;
      padding: 16px 20px;
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      background: #ffffff;
      position: relative;
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: avoid;
      break-after: avoid;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 900;
      font-size: 16px;
      letter-spacing: -0.5px;
    }
    .brand-text h1 {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .brand-text p {
      font-size: 10px;
      color: #475569;
      font-weight: 500;
    }
    .receipt-meta {
      text-align: right;
    }
    .receipt-title {
      font-size: 13px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .receipt-pill {
      display: inline-block;
      margin-top: 3px;
      padding: 2px 8px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #10b981;
      border-radius: 9999px;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.03em;
    }
    .meta-line {
      font-size: 10px;
      color: #64748b;
      margin-top: 3px;
      font-family: monospace;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      padding: 10px 12px;
    }
    .info-card-header {
      font-size: 9.5px;
      font-weight: 700;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 10.5px;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
    }
    .info-val {
      font-weight: 600;
      color: #0f172a;
      text-align: right;
    }
    .info-val.highlight {
      color: #1e3a8a;
      font-weight: 700;
    }
    .particulars-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .particulars-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 6px 10px;
      text-align: left;
    }
    .particulars-table th.tar, .particulars-table td.tar {
      text-align: right;
    }
    .particulars-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10.5px;
      vertical-align: middle;
    }
    .particulars-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .table-sub {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
    }
    .summary-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
      gap: 16px;
    }
    .words-box {
      flex: 1;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .words-label {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .words-val {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
      font-style: italic;
    }
    .total-box {
      width: 240px;
      border: 1.5px solid #059669;
      background: #ecfdf5;
      border-radius: 6px;
      padding: 8px 12px;
      text-align: right;
    }
    .total-label {
      font-size: 9px;
      font-weight: 700;
      color: #065f46;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .total-val {
      font-size: 18px;
      font-weight: 800;
      color: #047857;
      margin-top: 2px;
    }
    .auth-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 6px;
    }
    .auth-seal-block {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .seal-svg {
      width: 68px;
      height: 68px;
    }
    .auth-notes {
      font-size: 9.5px;
      color: #475569;
      line-height: 1.3;
    }
    .signature-block {
      text-align: center;
      width: 170px;
    }
    .sig-line {
      font-family: "Brush Script MT", "Segoe Script", cursive;
      font-size: 18px;
      color: #1e3a8a;
      margin-bottom: 2px;
    }
    .sig-divider {
      border-top: 1px solid #0f172a;
      margin-bottom: 4px;
    }
    .sig-title {
      font-size: 9px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .sig-sub {
      font-size: 8.5px;
      color: #64748b;
    }
    .footer-bar {
      margin-top: 12px;
      padding-top: 6px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <!-- Header -->
    <div class="header-bar">
      <div class="brand-section">
        <div class="logo-badge">HMS</div>
        <div class="brand-text">
          <h1>NKHALA CAMPUS RESIDENCE & HOSTELS</h1>
          <p>Office of Student Housing & Fee Accounts · Official Payment Receipt</p>
        </div>
      </div>
      <div class="receipt-meta">
        <div class="receipt-title">Payment Receipt</div>
        <div><span class="receipt-pill">✓ PAYMENT CLEARED</span></div>
        <div class="meta-line">Receipt No: <strong>${receiptNo}</strong></div>
      </div>
    </div>

    <!-- Student & Invoice Details Grid (2 Columns) -->
    <div class="details-grid">
      <!-- Student Info -->
      <div class="info-card">
        <div class="info-card-header">
          <span>Student Particulars</span>
          <span>Record Verified</span>
        </div>
        <div class="info-row">
          <span class="info-label">Student Name:</span>
          <span class="info-val highlight">${invoice.studentName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Student ID / Roll:</span>
          <span class="info-val" style="font-family: monospace;">${studentRoll}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Room & Block:</span>
          <span class="info-val">${roomInfo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Course / Program:</span>
          <span class="info-val">${courseInfo}</span>
        </div>
      </div>

      <!-- Transaction & Invoice Info -->
      <div class="info-card">
        <div class="info-card-header">
          <span>Payment Details</span>
          <span>Official Voucher</span>
        </div>
        <div class="info-row">
          <span class="info-label">Invoice Number:</span>
          <span class="info-val" style="font-family: monospace;">${invoice.invoiceNo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Date:</span>
          <span class="info-val">${formattedPaidDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method:</span>
          <span class="info-val highlight">${invoice.paymentMode || 'UPI'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Transaction / UTR Ref:</span>
          <span class="info-val" style="font-family: monospace;">${invoice.transactionRef || 'N/A'}</span>
        </div>
      </div>
    </div>

    <!-- Particulars Breakdown Table -->
    <table class="particulars-table">
      <thead>
        <tr>
          <th style="width: 38px;">#</th>
          <th>Fee Particulars / Description</th>
          <th style="width: 140px;">Category</th>
          <th style="width: 100px;">Due Date</th>
          <th class="tar" style="width: 110px;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>01</td>
          <td>
            <strong>${particularsDesc}</strong>
            <div class="table-sub">Invoice Ref: ${invoice.invoiceNo} · Validated for Academic Session 2024-26</div>
          </td>
          <td><span style="font-weight: 600;">${invoice.category}</span></td>
          <td>${formattedDueDate}</td>
          <td class="tar" style="font-weight: 700; font-size: 11px;">₹${amount.toLocaleString('en-IN')}.00</td>
        </tr>
      </tbody>
    </table>

    <!-- Summary & Amount in Words -->
    <div class="summary-section">
      <div class="words-box">
        <div class="words-label">Amount in Words</div>
        <div class="words-val">${inWords}</div>
        <div style="font-size: 9px; color: #64748b; margin-top: 4px;">
          Transaction cleared and reconciled under Account Ref: <strong>NKHALA-HMS-REC</strong>
        </div>
      </div>
      <div class="total-box">
        <div class="total-label">Total Amount Paid</div>
        <div class="total-val">₹${amount.toLocaleString('en-IN')}.00</div>
      </div>
    </div>

    <!-- Authentication & Signature Section -->
    <div class="auth-section">
      <div class="auth-seal-block">
        <!-- Official Vector Stamp -->
        <svg class="seal-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#059669" stroke-width="2" stroke-dasharray="3 2" />
          <circle cx="50" cy="50" r="41" fill="none" stroke="#059669" stroke-width="1.2" />
          <path id="curveTopPrint" d="M 18,50 A 32,32 0 0,1 82,50" fill="none" />
          <text font-size="7.5" font-weight="bold" fill="#059669" letter-spacing="1.2">
            <textPath href="#curveTopPrint" startOffset="50%" text-anchor="middle">NKHALA HOSTEL ACCOUNTS</textPath>
          </text>
          <path id="curveBottomPrint" d="M 82,50 A 32,32 0 0,1 18,50" fill="none" />
          <text font-size="7" font-weight="bold" fill="#059669" letter-spacing="1.2">
            <textPath href="#curveBottomPrint" startOffset="50%" text-anchor="middle">★ PAID & VERIFIED ★</textPath>
          </text>
          <circle cx="50" cy="50" r="20" fill="#ecfdf5" stroke="#10b981" stroke-width="1" />
          <path d="M43 50 L48 55 L58 43" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

        <div class="auth-notes">
          <div style="font-weight: 700; color: #047857; margin-bottom: 2px;">
            ✓ Official Digital Verification
          </div>
          <div>All fees subject to hostel terms & regulations.</div>
          <div>Generated on: ${new Date().toLocaleDateString('en-IN')} via HMS Portal.</div>
          ${invoice.receiptDocument ? `<div style="color: #059669; font-weight: 600; margin-top: 2px;">• Student Proof Attached & Verified (${invoice.receiptDocumentName || 'Payment Proof'})</div>` : ''}
        </div>
      </div>

      <div class="signature-block">
        <div class="sig-line">N. S. Sharma</div>
        <div class="sig-divider"></div>
        <div class="sig-title">Authorized Signatory</div>
        <div class="sig-sub">Accounts & Finance In-Charge</div>
      </div>
    </div>

    <!-- Footer Bar -->
    <div class="footer-bar">
      <span>This is a computer-generated receipt. No physical signature is required.</span>
      <span>Hostel Admin Office · support-hostel@nkhala.edu · Page 1 of 1</span>
    </div>
  </div>
</body>
</html>`;
}

// Print trigger function that prints ONLY the single-page student receipt via an isolated iframe
export function printFeeReceipt(invoice: FeeInvoice, student?: Student | null): void {
  try {
    const htmlContent = generateReceiptPrintHtml(invoice, student);

    // Remove existing print iframe if any
    const existing = document.getElementById('receipt-print-iframe');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'receipt-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      fallbackPrint();
      return;
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Give browser a moment to layout the fonts and styles before triggering print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          iframe.remove();
        }, 3000);
      } catch (err) {
        console.error('Error during iframe print, falling back to window.print():', err);
        fallbackPrint();
      }
    }, 250);
  } catch (err) {
    console.error('Failed to create print iframe, falling back:', err);
    fallbackPrint();
  }
}

// Fallback print handler using CSS class
function fallbackPrint(): void {
  document.body.classList.add('print-modal-mode');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('print-modal-mode');
  }, 1000);
  window.addEventListener('afterprint', function cleanup() {
    document.body.classList.remove('print-modal-mode');
    window.removeEventListener('afterprint', cleanup);
  });
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
  student: propStudent,
  allStudents = [],
  isAdmin = false,
  onRollbackPayment,
}) => {
  const [showProofPreview, setShowProofPreview] = useState(false);

  if (!isOpen || !invoice) return null;

  // Resolve matching student details
  const student =
    propStudent ||
    allStudents.find(
      s =>
        s.id === invoice.studentId ||
        (s.studentId && invoice.studentId && s.studentId.toLowerCase() === invoice.studentId.toLowerCase()) ||
        `${s.firstName} ${s.lastName}`.trim().toLowerCase() === invoice.studentName.trim().toLowerCase()
    );

  const amount = invoice.paidAmount || invoice.amount;
  const inWords = amountInWords(amount);
  const formattedPaidDate = formatReceiptDate(invoice.paidDate || invoice.issueDate);
  const formattedDueDate = formatReceiptDate(invoice.dueDate);
  const receiptNo = `RCP-${invoice.invoiceNo.replace('INV-', '')}`;
  const particularsDesc = getCategoryDescription(invoice.category);
  const roomInfo = student?.roomNumber
    ? `${student.blockName || 'Hostel'} · Room ${student.roomNumber}`
    : 'Campus Residence';
  const studentRoll = student?.rollNumber || student?.studentId || invoice.studentId || '—';
  const courseInfo = student?.course ? `${student.course} ${student.semester ? `(${student.semester})` : ''}` : 'Enrolled Student';

  const handlePrint = () => {
    printFeeReceipt(invoice, student);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Payment Receipt" maxWidth="720px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Top Control Notification */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--clr-surface-2)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--clr-border)',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--clr-text-muted)' }}>
            <ShieldCheck size={16} style={{ color: 'var(--clr-success)' }} />
            <span>Official student payment record for <strong>{invoice.studentName}</strong></span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>
        </div>

        {/* Visual Receipt Card (Matches Print Exactly) */}
        <div
          id="printable-fee-receipt"
          style={{
            border: '1.5px solid var(--clr-border)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--clr-surface)',
            padding: 24,
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
          }}
        >
          {/* Receipt Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid var(--clr-border)',
              paddingBottom: 16,
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  letterSpacing: '-0.5px',
                  boxShadow: '0 4px 10px rgba(59, 130, 246, 0.25)',
                }}
              >
                HMS
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--clr-text)' }}>
                  NKHALA CAMPUS RESIDENCE & HOSTELS
                </h4>
                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--clr-text-muted)' }}>
                  Office of Student Housing & Fee Accounts · Official Payment Receipt
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--clr-primary)', textTransform: 'uppercase' }}>
                Payment Receipt
              </div>
              <div style={{ marginTop: 4 }}>
                <span className="badge badge-active" style={{ fontSize: '0.74rem', padding: '3px 9px' }}>
                  ✓ PAYMENT CLEARED
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--clr-text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                Receipt No: <strong>{receiptNo}</strong>
              </div>
            </div>
          </div>

          {/* Student & Payment Info Grid (2 Columns) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {/* Student Info Box */}
            <div
              style={{
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--clr-surface-2)',
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--clr-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px dashed var(--clr-border)',
                  paddingBottom: 4,
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Student Particulars</span>
                <span style={{ color: 'var(--clr-success)' }}>Record Verified</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>Student Name:</span>
                  <span style={{ fontWeight: 700, color: 'var(--clr-text)' }}>{invoice.studentName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>Student ID / Roll:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{studentRoll}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>Room & Block:</span>
                  <span style={{ fontWeight: 600 }}>{roomInfo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>Course / Sem:</span>
                  <span style={{ fontWeight: 600 }}>{courseInfo}</span>
                </div>
              </div>
            </div>

            {/* Payment Details Box */}
            <div
              style={{
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--clr-surface-2)',
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--clr-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px dashed var(--clr-border)',
                  paddingBottom: 4,
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Payment Details</span>
                <span>Official Voucher</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>Invoice Number:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{invoice.invoiceNo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>Payment Date:</span>
                  <span style={{ fontWeight: 600 }}>{formattedPaidDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>Payment Method:</span>
                  <span style={{ fontWeight: 700, color: 'var(--clr-primary)' }}>{invoice.paymentMode || 'UPI'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>Transaction / UTR:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{invoice.transactionRef || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Particulars Table */}
          <div style={{ overflowX: 'auto', marginBottom: 14 }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.84rem',
              }}
            >
              <thead>
                <tr style={{ background: 'var(--clr-surface-2)', borderBottom: '2px solid var(--clr-border)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', width: 35 }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Fee Description</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', width: 120 }}>Category</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', width: 95 }}>Due Date</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: 100 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                  <td style={{ padding: '10px 10px', verticalAlign: 'top', color: 'var(--clr-text-muted)' }}>01</td>
                  <td style={{ padding: '10px 10px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: 'var(--clr-text)' }}>{particularsDesc}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>
                      Invoice Ref: {invoice.invoiceNo} · Validated for Academic Session 2024-26
                    </div>
                  </td>
                  <td style={{ padding: '10px 10px', verticalAlign: 'top', fontWeight: 600 }}>{invoice.category}</td>
                  <td style={{ padding: '10px 10px', verticalAlign: 'top', color: 'var(--clr-text-muted)' }}>
                    {formattedDueDate}
                  </td>
                  <td style={{ padding: '10px 10px', verticalAlign: 'top', textAlign: 'right', fontWeight: 700 }}>
                    ₹{amount.toLocaleString('en-IN')}.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary & Amount in Words */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'stretch',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                flex: '1 1 260px',
                border: '1px solid var(--clr-border)',
                background: 'var(--clr-surface-2)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>
                Amount in Words
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, fontStyle: 'italic', color: 'var(--clr-text)', marginTop: 2 }}>
                {inWords}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>
                Cleared and reconciled under Account Ref: <strong>NKHALA-HMS-REC</strong>
              </div>
            </div>

            <div
              style={{
                width: 220,
                border: '1.5px solid var(--clr-success)',
                background: 'var(--clr-success-pale, #ecfdf5)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--clr-success)', textTransform: 'uppercase' }}>
                Total Paid Amount
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--clr-success)', marginTop: 2 }}>
                ₹{amount.toLocaleString('en-IN')}.00
              </div>
            </div>
          </div>

          {/* Verification Seal & Signature Section */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--clr-border)',
              paddingTop: 12,
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Circular Official Seal */}
              <svg width="68" height="68" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#059669" strokeWidth="2" strokeDasharray="3 2" />
                <circle cx="50" cy="50" r="41" fill="none" stroke="#059669" strokeWidth="1.2" />
                <path id="curveTopScreen" d="M 18,50 A 32,32 0 0,1 82,50" fill="none" />
                <text fontSize="7.5" fontWeight="bold" fill="#059669" letterSpacing="1.2">
                  <textPath href="#curveTopScreen" startOffset="50%" textAnchor="middle">NKHALA HOSTEL ACCOUNTS</textPath>
                </text>
                <path id="curveBottomScreen" d="M 82,50 A 32,32 0 0,1 18,50" fill="none" />
                <text fontSize="7" fontWeight="bold" fill="#059669" letterSpacing="1.2">
                  <textPath href="#curveBottomScreen" startOffset="50%" textAnchor="middle">★ PAID & VERIFIED ★</textPath>
                </text>
                <circle cx="50" cy="50" r="20" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                <path d="M43 50 L48 55 L58 43" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', lineHeight: 1.35 }}>
                <div style={{ fontWeight: 700, color: 'var(--clr-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> Official Digital Verification
                </div>
                <div>All fees subject to hostel terms & regulations.</div>
                <div>Generated on: {new Date().toLocaleDateString('en-IN')} via HMS Portal.</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', width: 170 }}>
              <div
                style={{
                  fontFamily: '"Brush Script MT", "Segoe Script", cursive',
                  fontSize: '1.25rem',
                  color: 'var(--clr-primary)',
                  marginBottom: 2,
                }}
              >
                N. S. Sharma
              </div>
              <div style={{ borderTop: '1px solid var(--clr-text)', marginBottom: 4 }} />
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--clr-text)', textTransform: 'uppercase' }}>
                Authorized Signatory
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)' }}>Accounts & Finance In-Charge</div>
            </div>
          </div>
        </div>

        {/* Attached Proof Document Preview (Collapsible on screen) */}
        {invoice.receiptDocument && (
          <div
            style={{
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--clr-surface-2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                cursor: 'pointer',
              }}
              onClick={() => setShowProofPreview(prev => !prev)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', fontWeight: 600 }}>
                <Paperclip size={15} style={{ color: 'var(--clr-primary)' }} />
                <span>Student Attached Payment Proof ({invoice.receiptDocumentName || 'Document'})</span>
              </div>
              <span style={{ fontSize: '0.76rem', color: 'var(--clr-primary)', fontWeight: 600 }}>
                {showProofPreview ? 'Hide Proof' : 'View Proof File'}
              </span>
            </div>

            {showProofPreview && (
              <div style={{ padding: 14, borderTop: '1px solid var(--clr-border)', background: 'var(--clr-bg)' }}>
                {invoice.receiptDocumentType === 'image' ? (
                  <div style={{ textAlign: 'center' }}>
                    <img
                      src={invoice.receiptDocument}
                      alt="Student Receipt Proof"
                      style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)' }}
                    />
                    <div style={{ marginTop: 10 }}>
                      <a
                        href={invoice.receiptDocument}
                        download={invoice.receiptDocumentName || 'payment_proof.png'}
                        className="btn btn-outline btn-sm"
                      >
                        <Download size={13} /> Download Proof Image
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={24} style={{ color: '#ef4444' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{invoice.receiptDocumentName || 'payment_proof.pdf'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>PDF Verification Document</div>
                      </div>
                    </div>
                    <a
                      href={invoice.receiptDocument}
                      download={invoice.receiptDocumentName || 'payment_proof.pdf'}
                      className="btn btn-primary btn-sm"
                    >
                      <Download size={13} /> Download PDF
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="modal-footer" style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {isAdmin && onRollbackPayment && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                style={{
                  background: 'var(--clr-danger-pale)',
                  color: 'var(--clr-danger)',
                  borderColor: 'var(--clr-danger-pale)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onClick={() => onRollbackPayment(invoice)}
                title="Mark invoice as unpaid"
              >
                <RotateCcw size={13} /> Roll Back Payment
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button type="button" className="btn btn-outline-dark btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentReceiptModal;
