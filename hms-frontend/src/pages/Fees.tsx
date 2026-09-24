import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import KpiCard from '../components/ui/KpiCard';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import HistoryModal from '../components/ui/HistoryModal';
import ColumnVisibilityDropdown, { type ColumnConfig } from '../components/ui/ColumnVisibilityDropdown';
import BulkActionBar from '../components/ui/BulkActionBar';
import TablePagination from '../components/ui/TablePagination';
import { mockFees, mockStudents } from '../data/mockData';
import type { FeeInvoice, FeeCategory, FeeStatus } from '../types';
import { getStoredData, setStoredData } from '../utils/storage';
import { exportToCSV } from '../utils/exportCsv';
import { logAuditAction } from '../utils/auditLogger';
import { useAuth } from '../context/AuthContext';
import {
  Banknote,
  CheckCircle,
  Hourglass,
  AlertTriangle,
  Download,
  Trash2,
  Edit2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Plus,
  Receipt,
  ShieldCheck,
  Send,
  X,
  Eye,
  History
} from 'lucide-react';

const STORAGE_KEY = 'hms_fees_data';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'select', label: 'Select', visible: true, required: true },
  { key: 'invoiceNo', label: 'Invoice No.', visible: true, required: true },
  { key: 'studentName', label: 'Student', visible: true, required: true },
  { key: 'category', label: 'Category', visible: true },
  { key: 'amount', label: 'Amount (₹)', visible: true },
  { key: 'dueDate', label: 'Due Date', visible: true },
  { key: 'paidDate', label: 'Paid On', visible: true },
  { key: 'paymentMode', label: 'Payment Mode', visible: false },
  { key: 'status', label: 'Status', visible: true },
  { key: 'actions', label: 'Actions', visible: true, required: true },
];

type SortField = 'invoiceNo' | 'studentName' | 'category' | 'amount' | 'dueDate' | 'paidDate' | 'status';
type SortOrder = 'asc' | 'desc';

const CATEGORIES: FeeCategory[] = [
  'Hostel Sem Fee',
  'Mess Fee',
  'Security Deposit',
  'Electricity',
  'Other',
];

const Fees: React.FC = () => {
  const [fees, setFees] = useState<FeeInvoice[]>(() =>
    getStoredData<FeeInvoice[]>(STORAGE_KEY, mockFees)
  );

  useEffect(() => {
    setStoredData(STORAGE_KEY, fees);
  }, [fees]);

  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [showGenerate, setShowGenerate] = useState(false);
  const [showRecord, setShowRecord] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeInvoice | null>(null);
  const [receiptFee, setReceiptFee] = useState<FeeInvoice | null>(null);
  const [selectedFee, setSelectedFee] = useState<FeeInvoice | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Delete confirms
  const [feeToDelete, setFeeToDelete] = useState<FeeInvoice | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Forms
  const [payForm, setPayForm] = useState({ amount: '', date: '', mode: 'UPI', ref: '' });
  const [genForm, setGenForm] = useState(() => ({
    studentName: '',
    category: 'Hostel Sem Fee' as FeeCategory,
    amount: '12000',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    notes: '',
  }));

  const resetAllData = () => {
    if (confirm('Reset fee invoices to default sample records?')) {
      setFees(mockFees);
      setSelectedIds([]);
      logAuditAction(
        'fees',
        'RESET',
        'All Fee Invoices',
        user?.name || 'Administrator',
        'Restored fee invoice records back to default demo data'
      );
    }
  };

  // KPIs
  const paid = fees.filter(f => f.status === 'paid').length;
  const pending = fees.filter(f => f.status === 'pending').length;
  const overdue = fees.filter(f => f.status === 'overdue').length;
  const totalCollected = fees
    .filter(f => f.status === 'paid')
    .reduce((s, f) => s + (f.paidAmount || f.amount || 0), 0);

  // Sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & Sort
  const filtered = fees.filter(f => {
    const q = search.toLowerCase();
    const matchQ =
      f.studentName.toLowerCase().includes(q) ||
      f.invoiceNo.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      (f.paymentMode && f.paymentMode.toLowerCase().includes(q)) ||
      (f.transactionRef && f.transactionRef.toLowerCase().includes(q));

    const matchS = !statusFilter || f.status === statusFilter;
    const matchC = !catFilter || f.category === catFilter;
    return matchQ && matchS && matchC;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === 'amount') {
      aVal = a.amount;
      bVal = b.amount;
    } else {
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const isAll = pageSize >= 9999;
  const paginated = isAll
    ? sorted
    : sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(sorted.map(f => f.id));
    else setSelectedIds([]);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Generate Invoice Handler
  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInvoice: FeeInvoice = {
      id: `f_${Date.now()}`,
      invoiceNo: `INV-2024-${String(fees.length + 1).padStart(3, '0')}`,
      studentId: `s_${Date.now()}`,
      studentName: genForm.studentName.trim(),
      category: genForm.category,
      amount: Number(genForm.amount),
      issueDate: genForm.issueDate,
      dueDate: genForm.dueDate,
      status: 'pending',
    };

    setFees(prev => [newInvoice, ...prev]);
    setShowGenerate(false);
    setGenForm({
      studentName: '',
      category: 'Hostel Sem Fee',
      amount: '12000',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      notes: '',
    });

    logAuditAction(
      'fees',
      'CREATE',
      `${newInvoice.invoiceNo} (${newInvoice.studentName})`,
      user?.name || 'Administrator',
      `Generated ${newInvoice.category} invoice for ₹${newInvoice.amount.toLocaleString('en-IN')}`
    );
  };

  // Open Edit Modal
  const openEdit = (fee: FeeInvoice) => {
    setEditingFee(fee);
  };

  // Save Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFee) return;

    setFees(prev =>
      prev.map(f => (f.id === editingFee.id ? editingFee : f))
    );

    logAuditAction(
      'fees',
      'UPDATE',
      `${editingFee.invoiceNo} (${editingFee.studentName})`,
      user?.name || 'Administrator',
      `Updated invoice parameters: Amount: ₹${editingFee.amount}, Due: ${editingFee.dueDate}, Status: ${editingFee.status}`
    );

    setEditingFee(null);
  };

  // Record Payment
  const openRecord = (fee: FeeInvoice) => {
    setSelectedFee(fee);
    setPayForm({
      amount: String(fee.amount),
      date: new Date().toISOString().slice(0, 10),
      mode: fee.paymentMode || 'UPI',
      ref: fee.transactionRef || '',
    });
    setShowRecord(true);
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;

    logAuditAction(
      'fees',
      'PAYMENT',
      `${selectedFee.invoiceNo} (${selectedFee.studentName})`,
      user?.name || 'Administrator',
      `Recorded manual fee payment of ₹${Number(payForm.amount).toLocaleString('en-IN')} via ${payForm.mode}`
    );

    setFees(prev =>
      prev.map(f =>
        f.id === selectedFee.id
          ? {
              ...f,
              status: 'paid',
              paidDate: payForm.date,
              paidAmount: Number(payForm.amount),
              paymentMode: payForm.mode,
              transactionRef: payForm.ref.trim(),
            }
          : f
      )
    );

    setShowRecord(false);
    setSelectedFee(null);
  };

  // Quick Status change
  const handleQuickStatus = (id: string, newStatus: FeeStatus) => {
    setFees(prev =>
      prev.map(f => {
        if (f.id === id) {
          if (newStatus === 'paid' && !f.paidDate) {
            return {
              ...f,
              status: newStatus,
              paidDate: new Date().toISOString().slice(0, 10),
              paidAmount: f.amount,
              paymentMode: f.paymentMode || 'UPI',
            };
          }
          return { ...f, status: newStatus };
        }
        return f;
      })
    );
  };

  // Delete Handlers
  const handleDeleteConfirm = () => {
    if (!feeToDelete) return;

    logAuditAction(
      'fees',
      'DELETE',
      `${feeToDelete.invoiceNo} (${feeToDelete.studentName})`,
      user?.name || 'Administrator',
      `Deleted invoice record from ledger`
    );

    setFees(prev => prev.filter(f => f.id !== feeToDelete.id));
    setSelectedIds(prev => prev.filter(id => id !== feeToDelete.id));
    setFeeToDelete(null);
  };

  const handleBulkDeleteConfirm = () => {
    logAuditAction(
      'fees',
      'BULK_DELETE',
      `${selectedIds.length} Invoices`,
      user?.name || 'Administrator',
      `Bulk deleted ${selectedIds.length} fee invoices`
    );

    setFees(prev => prev.filter(f => !selectedIds.includes(f.id)));
    setSelectedIds([]);
    setShowBulkDeleteConfirm(false);
  };

  const handleBulkMarkPaid = () => {
    setFees(prev =>
      prev.map(f =>
        selectedIds.includes(f.id)
          ? {
              ...f,
              status: 'paid',
              paidDate: f.paidDate || new Date().toISOString().slice(0, 10),
              paidAmount: f.paidAmount || f.amount,
              paymentMode: f.paymentMode || 'UPI',
            }
          : f
      )
    );
  };

  // CSV Export
  const handleExport = () => {
    exportToCSV<FeeInvoice>('fee_invoices_export', sorted, [
      { key: 'invoiceNo', label: 'Invoice No.' },
      { key: 'studentName', label: 'Student Name' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount (₹)' },
      { key: 'issueDate', label: 'Issue Date' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'paidDate', label: 'Paid Date', format: f => f.paidDate || '—' },
      { key: 'paidAmount', label: 'Paid Amount', format: f => (f.paidAmount ? `₹${f.paidAmount}` : '—') },
      { key: 'paymentMode', label: 'Payment Mode', format: f => f.paymentMode || '—' },
      { key: 'transactionRef', label: 'Ref / UTR', format: f => f.transactionRef || '—' },
      { key: 'status', label: 'Status' },
    ]);
  };

  const isColVisible = (key: string) => {
    const col = columns.find(c => c.key === key);
    return col ? col.visible : true;
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon" />;
    return sortOrder === 'asc' ? <ArrowUp size={12} className="sort-icon" /> : <ArrowDown size={12} className="sort-icon" />;
  };

  const { user, role } = useAuth();
  const isStudent = role === 'student';

  const currentStudent = mockStudents.find(s =>
    (user?.studentId && s.studentId.toLowerCase() === user.studentId.toLowerCase()) ||
    (user?.id && s.id === user.id) ||
    (user?.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
    (user?.name && `${s.firstName} ${s.lastName}`.toLowerCase() === user.name.toLowerCase())
  ) || {
    id: user?.id || 's1',
    studentId: user?.studentId || 'STU-2024-001',
    firstName: user?.name ? user.name.split(' ')[0] : 'Amit',
    lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : 'Rathore',
    roomNumber: 'A-101',
  };

  const studentFullName = `${currentStudent.firstName} ${currentStudent.lastName}`.toLowerCase();
  const myFees = fees.filter(f =>
    f.studentId === currentStudent.id ||
    (user?.studentId && f.studentId?.toLowerCase() === user.studentId.toLowerCase()) ||
    f.studentName.toLowerCase().includes(currentStudent.firstName.toLowerCase()) ||
    f.studentName.toLowerCase() === studentFullName
  );

  const [studentPaymentSuccess, setStudentPaymentSuccess] = useState('');
  const [showPaymentRequest, setShowPaymentRequest] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    paymentMode: 'UPI',
    transactionRef: '',
    paidAmount: 0,
    paidDate: new Date().toISOString().slice(0, 10),
    remarks: '',
  });

  const [viewReceipt, setViewReceipt] = useState<FeeInvoice | null>(null);

  const openPaymentModal = (invoice?: FeeInvoice) => {
    const inv = invoice || myFees.find(f => f.status !== 'paid') || myFees[0];
    if (inv) {
      setPaymentForm({
        invoiceId: inv.id,
        paymentMode: 'UPI',
        transactionRef: '',
        paidAmount: inv.amount,
        paidDate: new Date().toISOString().slice(0, 10),
        remarks: '',
      });
    }
    setShowPaymentRequest(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.transactionRef.trim()) return;

    setFees(prev =>
      prev.map(f => {
        if (f.id === paymentForm.invoiceId) {
          return {
            ...f,
            status: 'paid',
            paidDate: paymentForm.paidDate,
            paidAmount: Number(paymentForm.paidAmount) || f.amount,
            paymentMode: paymentForm.paymentMode,
            transactionRef: paymentForm.transactionRef.trim(),
          };
        }
        return f;
      })
    );

    setShowPaymentRequest(false);
    setStudentPaymentSuccess(
      `Payment request submitted successfully! Ref: ${paymentForm.transactionRef.trim()} recorded. Changes are now visible to the accounts office & warden.`
    );

    const targetInv = myFees.find(f => f.id === paymentForm.invoiceId);
    logAuditAction(
      'fees',
      'PAYMENT',
      `${targetInv ? targetInv.invoiceNo : 'Fee Invoice'} (${currentStudent.firstName} ${currentStudent.lastName})`,
      `${currentStudent.firstName} ${currentStudent.lastName} (Student)`,
      `Submitted fee clearance payment via ${paymentForm.paymentMode} (Ref: ${paymentForm.transactionRef.trim()}) for ₹${(paymentForm.paidAmount || (targetInv ? targetInv.amount : 0)).toLocaleString('en-IN')}`
    );
  };

  // ============================================================
  // STUDENT VIEW (Only view own fee records & send payment requests)
  // ============================================================
  if (isStudent) {
    const totalBilled = myFees.reduce((acc, f) => acc + f.amount, 0);
    const totalPaid = myFees
      .filter(f => f.status === 'paid')
      .reduce((acc, f) => acc + (f.paidAmount || f.amount), 0);
    const totalPending = myFees
      .filter(f => f.status !== 'paid')
      .reduce((acc, f) => acc + f.amount, 0);
    const hasPendingInvoices = myFees.some(f => f.status !== 'paid');

    return (
      <PageLayout>
        <div className="student-profile-container">
          <div className="page-header-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 className="page-title" style={{ margin: 0 }}>My Fees & Dues</h1>
                <span className="profile-pill highlight">
                  <ShieldCheck size={14} /> Student Access
                </span>
              </div>
              <p className="page-subtitle">
                Semester hostel fees, mess bills & payment clearance requests for {currentStudent.firstName} {currentStudent.lastName}
              </p>
            </div>
            <div className="page-header-actions">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => setShowHistoryModal(true)}
                title="View fee payment & invoice history"
              >
                <History size={14} />
                <span>History</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => openPaymentModal()}
                disabled={!hasPendingInvoices}
                title={hasPendingInvoices ? 'Send payment clearance request' : 'No pending dues to clear'}
              >
                <Send size={15} />
                <span>Submit Fee Payment Request</span>
              </button>
            </div>
          </div>

          {studentPaymentSuccess && (
            <div className="student-alert-success">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={18} />
                <span>{studentPaymentSuccess}</span>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setStudentPaymentSuccess('')}
                style={{ color: 'inherit' }}
              >
                <X size={15} />
              </button>
            </div>
          )}

          <div className="student-permission-banner">
            <ShieldCheck size={20} className="student-permission-icon" />
            <div>
              <div>
                <strong>Confidential Financial Records:</strong> You are viewing fee invoices issued solely to your account (<strong>{currentStudent.firstName} {currentStudent.lastName}</strong>, ID: {currentStudent.studentId}).
              </div>
              <div style={{ marginTop: 4, opacity: 0.9, fontSize: '0.84rem' }}>
                You have permission to submit payment reference / clearance requests. When submitted, the accounts office will verify the transaction.
              </div>
            </div>
          </div>

          {/* Student Fee KPIs */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="kpi-card accent">
              <div className="kpi-label">
                <span>Total Fees Billed</span>
                <span className="icon"><Receipt size={20} /></span>
              </div>
              <div className="kpi-value">₹{totalBilled.toLocaleString('en-IN')}</div>
              <div className="kpi-change">All assigned fee invoices</div>
            </div>

            <div className="kpi-card green">
              <div className="kpi-label">
                <span>Total Cleared / Paid</span>
                <span className="icon"><CheckCircle size={20} /></span>
              </div>
              <div className="kpi-value">₹{totalPaid.toLocaleString('en-IN')}</div>
              <div className="kpi-change up">Verified payments</div>
            </div>

            <div className={`kpi-card ${totalPending > 0 ? 'warning' : 'green'}`}>
              <div className="kpi-label">
                <span>Outstanding Dues</span>
                <span className="icon"><Banknote size={20} /></span>
              </div>
              <div className="kpi-value">₹{totalPending.toLocaleString('en-IN')}</div>
              <div className={`kpi-change ${totalPending > 0 ? 'down' : 'up'}`}>
                {totalPending > 0 ? 'Payment required' : 'All dues clear!'}
              </div>
            </div>
          </div>

          {/* Student Invoices Table */}
          <div className="data-table-card">
            <div className="data-table-header">
              <h3>My Invoices & Receipts ({myFees.length})</h3>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Category</th>
                    <th>Amount (₹)</th>
                    <th>Due Date</th>
                    <th>Paid On</th>
                    <th>Payment Mode / UTR</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myFees.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{f.invoiceNo}</td>
                      <td>{f.category}</td>
                      <td style={{ fontWeight: 700, color: 'var(--clr-text)' }}>
                        ₹{f.amount.toLocaleString('en-IN')}
                      </td>
                      <td>{f.dueDate}</td>
                      <td>{f.paidDate || <span style={{ color: 'var(--clr-text-muted)' }}>Pending</span>}</td>
                      <td>
                        {f.paymentMode ? (
                          <div>
                            <span style={{ fontWeight: 600 }}>{f.paymentMode}</span>
                            {f.transactionRef && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontFamily: 'monospace' }}>
                                {f.transactionRef}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--clr-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <Badge variant={f.status === 'paid' ? 'active' : f.status === 'overdue' ? 'danger' : 'pending'}>
                          {f.status === 'paid' ? 'Paid' : f.status === 'overdue' ? 'Overdue' : 'Pending'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn-icon"
                            title="View Receipt"
                            onClick={() => setViewReceipt(f)}
                          >
                            <Eye size={14} />
                          </button>
                          {f.status !== 'paid' && (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                              onClick={() => openPaymentModal(f)}
                            >
                              Send Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {myFees.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--clr-text-muted)' }}>
                        No fee invoices found for your student profile.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAYMENT CLEARANCE REQUEST MODAL */}
          {showPaymentRequest && (
            <Modal
              isOpen={showPaymentRequest}
              onClose={() => setShowPaymentRequest(false)}
              title="Submit Fee Payment / Clearance Request"
            >
              <form onSubmit={handlePaymentSubmit}>
                <div className="form-group">
                  <label>Select Invoice to Clear *</label>
                  <select
                    className="form-select"
                    value={paymentForm.invoiceId}
                    onChange={e => {
                      const selected = myFees.find(f => f.id === e.target.value);
                      setPaymentForm(f => ({
                        ...f,
                        invoiceId: e.target.value,
                        paidAmount: selected ? selected.amount : f.paidAmount,
                      }));
                    }}
                    required
                  >
                    {myFees.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.invoiceNo} — {f.category} (₹{f.amount.toLocaleString('en-IN')}) [{f.status.toUpperCase()}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Payment Mode *</label>
                    <select
                      className="form-select"
                      value={paymentForm.paymentMode}
                      onChange={e => setPaymentForm(f => ({ ...f, paymentMode: e.target.value }))}
                    >
                      <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                      <option value="NEFT/RTGS">NEFT / Net Banking / RTGS</option>
                      <option value="Card">Debit / Credit Card</option>
                      <option value="Cash at Warden Desk">Cash at Warden Desk</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Amount Paid (₹) *</label>
                    <input
                      className="form-input"
                      type="number"
                      value={paymentForm.paidAmount}
                      onChange={e => setPaymentForm(f => ({ ...f, paidAmount: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Transaction ID / UTR / Reference Number *</label>
                    <input
                      className="form-input"
                      value={paymentForm.transactionRef}
                      onChange={e => setPaymentForm(f => ({ ...f, transactionRef: e.target.value }))}
                      placeholder="e.g. UTR2499102488 or UPI ref"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Payment Date *</label>
                    <input
                      className="form-input"
                      type="date"
                      value={paymentForm.paidDate}
                      onChange={e => setPaymentForm(f => ({ ...f, paidDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Payment Remarks (Optional)</label>
                  <input
                    className="form-input"
                    value={paymentForm.remarks}
                    onChange={e => setPaymentForm(f => ({ ...f, remarks: e.target.value }))}
                    placeholder="e.g. Semester 3 mess & room fee paid from HDFC account"
                  />
                </div>

                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--clr-bg)',
                    border: '1px solid var(--clr-border)',
                    fontSize: '0.78rem',
                    color: 'var(--clr-text-muted)',
                  }}
                >
                  ℹ️ Once submitted, the transaction reference is instantly sent to the Accounts Office and Hostel Administration for verification.
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-dark" onClick={() => setShowPaymentRequest(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Payment Request ✓
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* VIEW RECEIPT MODAL */}
          {viewReceipt && (
            <Modal
              isOpen={!!viewReceipt}
              onClose={() => setViewReceipt(null)}
              title={`Fee Invoice — ${viewReceipt.invoiceNo}`}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{viewReceipt.category}</h3>
                  <Badge variant={viewReceipt.status === 'paid' ? 'active' : 'pending'}>
                    {viewReceipt.status.toUpperCase()}
                  </Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Student Name</span>
                    <span className="profile-field-val">{viewReceipt.studentName}</span>
                  </div>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Amount</span>
                    <span className="profile-field-val" style={{ color: 'var(--clr-primary)', fontWeight: 700 }}>
                      ₹{viewReceipt.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Due Date</span>
                    <span className="profile-field-val">{viewReceipt.dueDate}</span>
                  </div>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Paid On</span>
                    <span className="profile-field-val">{viewReceipt.paidDate || 'Not paid'}</span>
                  </div>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Payment Mode</span>
                    <span className="profile-field-val">{viewReceipt.paymentMode || '—'}</span>
                  </div>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Transaction Ref</span>
                    <span className="profile-field-val" style={{ fontFamily: 'monospace' }}>
                      {viewReceipt.transactionRef || '—'}
                    </span>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setViewReceipt(null)}>
                    Close
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* Student Fee Activity History Modal */}
          <HistoryModal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            moduleName="fees"
            title="My Fee Invoices & Payment History"
          />
        </div>
      </PageLayout>
    );
  }

  // ============================================================
  // ADMIN VIEW (Full master fees ledger & invoice control)
  // ============================================================
  return (
    <PageLayout>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="page-subtitle">
            Student invoices, live collection tracking, payment reconciliation & dues
          </p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={resetAllData}
            title="Reset data back to defaults"
          >
            <RotateCcw size={14} />
            <span>Reset Demo</span>
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={handleExport}
            title="Export invoices to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => setShowHistoryModal(true)}
            title="View table action history log"
          >
            <History size={14} />
            <span>History</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowGenerate(true)}
          >
            <Plus size={15} />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard
          label="Total Collected"
          value={`₹${(totalCollected / 100000).toFixed(2)}L`}
          change={`${paid} invoices collected`}
          changeType="up"
          accent="green"
          icon={<Banknote size={24} />}
        />
        <KpiCard
          label="Paid Invoices"
          value={paid}
          change={`${((paid / (fees.length || 1)) * 100).toFixed(0)}% paid`}
          changeType="up"
          accent="accent"
          icon={<CheckCircle size={24} />}
          delay={0.1}
        />
        <KpiCard
          label="Pending Invoices"
          value={pending}
          change="Awaiting payment"
          changeType="down"
          accent="warning"
          icon={<Hourglass size={24} />}
          delay={0.2}
        />
        <KpiCard
          label="Overdue Invoices"
          value={overdue}
          change="Urgent follow-up"
          changeType="down"
          accent="danger"
          icon={<AlertTriangle size={24} />}
          delay={0.3}
        />
      </div>

      <div className="data-table-card">
        <div className="data-table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3>Fee Records & Invoices</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
              ({sorted.length} {sorted.length === 1 ? 'record' : 'records'})
            </span>
          </div>

          <div className="table-controls">
            <select
              className="search-input"
              style={{ width: 130 }}
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              className="search-input"
              style={{ width: 150 }}
              value={catFilter}
              onChange={e => {
                setCatFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              className="search-input"
              placeholder="Search invoice, student…"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />

            <ColumnVisibilityDropdown columns={columns} onChange={setColumns} />
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div style={{ padding: '0 20px', paddingTop: 14 }}>
            <BulkActionBar
              selectedCount={selectedIds.length}
              totalCount={sorted.length}
              onClear={() => setSelectedIds([])}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={handleBulkMarkPaid}
                >
                  Mark Selected as Paid
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                >
                  <Trash2 size={13} />
                  <span>Delete Selected</span>
                </button>
              </div>
            </BulkActionBar>
          </div>
        )}

        {/* Scrollable Table */}
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {isColVisible('select') && (
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="table-checkbox"
                      checked={sorted.length > 0 && selectedIds.length === sorted.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                {isColVisible('invoiceNo') && (
                  <th className="sortable" onClick={() => handleSort('invoiceNo')}>
                    <div className={`th-sort-wrapper ${sortField === 'invoiceNo' ? 'active' : ''}`}>
                      <span>Invoice No.</span>
                      {renderSortIndicator('invoiceNo')}
                    </div>
                  </th>
                )}
                {isColVisible('studentName') && (
                  <th className="sortable" onClick={() => handleSort('studentName')}>
                    <div className={`th-sort-wrapper ${sortField === 'studentName' ? 'active' : ''}`}>
                      <span>Student</span>
                      {renderSortIndicator('studentName')}
                    </div>
                  </th>
                )}
                {isColVisible('category') && (
                  <th className="sortable" onClick={() => handleSort('category')}>
                    <div className={`th-sort-wrapper ${sortField === 'category' ? 'active' : ''}`}>
                      <span>Category</span>
                      {renderSortIndicator('category')}
                    </div>
                  </th>
                )}
                {isColVisible('amount') && (
                  <th className="sortable" onClick={() => handleSort('amount')}>
                    <div className={`th-sort-wrapper ${sortField === 'amount' ? 'active' : ''}`}>
                      <span>Amount</span>
                      {renderSortIndicator('amount')}
                    </div>
                  </th>
                )}
                {isColVisible('dueDate') && (
                  <th className="sortable" onClick={() => handleSort('dueDate')}>
                    <div className={`th-sort-wrapper ${sortField === 'dueDate' ? 'active' : ''}`}>
                      <span>Due Date</span>
                      {renderSortIndicator('dueDate')}
                    </div>
                  </th>
                )}
                {isColVisible('paidDate') && (
                  <th className="sortable" onClick={() => handleSort('paidDate')}>
                    <div className={`th-sort-wrapper ${sortField === 'paidDate' ? 'active' : ''}`}>
                      <span>Paid On</span>
                      {renderSortIndicator('paidDate')}
                    </div>
                  </th>
                )}
                {isColVisible('paymentMode') && <th>Mode</th>}
                {isColVisible('status') && (
                  <th className="sortable" onClick={() => handleSort('status')}>
                    <div className={`th-sort-wrapper ${sortField === 'status' ? 'active' : ''}`}>
                      <span>Status</span>
                      {renderSortIndicator('status')}
                    </div>
                  </th>
                )}
                {isColVisible('actions') && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map(f => {
                const isSelected = selectedIds.includes(f.id);
                return (
                  <tr key={f.id} className={isSelected ? 'row-selected' : ''}>
                    {isColVisible('select') && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(f.id)}
                        />
                      </td>
                    )}
                    {isColVisible('invoiceNo') && (
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{f.invoiceNo}</td>
                    )}
                    {isColVisible('studentName') && (
                      <td>
                        <div className="avatar-row">
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: '.7rem' }}>
                            {f.studentName
                              .split(' ')
                              .map((w: string) => w[0])
                              .join('')}
                          </div>
                          <span style={{ fontWeight: 600 }}>{f.studentName}</span>
                        </div>
                      </td>
                    )}
                    {isColVisible('category') && <td>{f.category}</td>}
                    {isColVisible('amount') && (
                      <td style={{ fontWeight: 700 }}>₹{f.amount.toLocaleString('en-IN')}</td>
                    )}
                    {isColVisible('dueDate') && <td>{f.dueDate}</td>}
                    {isColVisible('paidDate') && <td>{f.paidDate ?? '—'}</td>}
                    {isColVisible('paymentMode') && <td>{f.paymentMode ?? '—'}</td>}
                    {isColVisible('status') && (
                      <td>
                        <select
                          className="table-quick-select"
                          value={f.status}
                          onChange={e => handleQuickStatus(f.id, e.target.value as FeeStatus)}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </td>
                    )}
                    {isColVisible('actions') && (
                      <td>
                        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                          {f.status === 'paid' ? (
                            <button
                              type="button"
                              className="btn btn-outline-dark btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                              onClick={() => setReceiptFee(f)}
                            >
                              <Receipt size={13} />
                              <span>Receipt</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                              onClick={() => openRecord(f)}
                            >
                              Pay
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-icon"
                            title="Edit invoice data"
                            onClick={() => openEdit(f)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-danger-icon"
                            title="Delete invoice"
                            onClick={() => setFeeToDelete(f)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.filter(c => c.visible).length}
                    style={{ textAlign: 'center', padding: '32px', color: 'var(--clr-text-muted)' }}
                  >
                    No fee invoices match filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalItems={sorted.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* GENERATE INVOICE MODAL */}
      <Modal
        isOpen={showGenerate}
        onClose={() => setShowGenerate(false)}
        title="Generate New Fee Invoice"
        maxWidth="560px"
      >
        <form onSubmit={handleGenerateSubmit}>
          <div className="form-group">
            <label>Student *</label>
            <input
              className="form-input"
              list="fee-student-list"
              value={genForm.studentName}
              onChange={e => setGenForm(f => ({ ...f, studentName: e.target.value }))}
              placeholder="Type or select student name..."
              required
            />
            <datalist id="fee-student-list">
              {mockStudents.map(s => (
                <option key={s.id} value={`${s.firstName} ${s.lastName}`} />
              ))}
            </datalist>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fee Category *</label>
              <select
                className="form-select"
                value={genForm.category}
                onChange={e => setGenForm(f => ({ ...f, category: e.target.value as FeeCategory }))}
                required
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Amount (₹) *</label>
              <input
                className="form-input"
                type="number"
                min={1}
                value={genForm.amount}
                onChange={e => setGenForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 12000"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Issue Date *</label>
              <input
                className="form-input"
                type="date"
                value={genForm.issueDate}
                onChange={e => setGenForm(f => ({ ...f, issueDate: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Due Date *</label>
              <input
                className="form-input"
                type="date"
                value={genForm.dueDate}
                onChange={e => setGenForm(f => ({ ...f, dueDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              className="form-textarea"
              value={genForm.notes}
              onChange={e => setGenForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notes or payment terms..."
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-dark" onClick={() => setShowGenerate(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Generate & Save Invoice ✓
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT INVOICE MODAL */}
      {editingFee && (
        <Modal
          isOpen={!!editingFee}
          onClose={() => setEditingFee(null)}
          title={`Edit Invoice — ${editingFee.invoiceNo}`}
          maxWidth="560px"
        >
          <form onSubmit={handleEditSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Invoice Number *</label>
                <input
                  className="form-input"
                  value={editingFee.invoiceNo}
                  onChange={e => setEditingFee({ ...editingFee, invoiceNo: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Student Name *</label>
                <input
                  className="form-input"
                  value={editingFee.studentName}
                  onChange={e => setEditingFee({ ...editingFee, studentName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  className="form-select"
                  value={editingFee.category}
                  onChange={e => setEditingFee({ ...editingFee, category: e.target.value as FeeCategory })}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₹) *</label>
                <input
                  className="form-input"
                  type="number"
                  value={editingFee.amount}
                  onChange={e => setEditingFee({ ...editingFee, amount: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Issue Date *</label>
                <input
                  className="form-input"
                  type="date"
                  value={editingFee.issueDate}
                  onChange={e => setEditingFee({ ...editingFee, issueDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Due Date *</label>
                <input
                  className="form-input"
                  type="date"
                  value={editingFee.dueDate}
                  onChange={e => setEditingFee({ ...editingFee, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-select"
                  value={editingFee.status}
                  onChange={e => setEditingFee({ ...editingFee, status: e.target.value as FeeStatus })}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="form-group">
                <label>Payment Mode</label>
                <select
                  className="form-select"
                  value={editingFee.paymentMode || ''}
                  onChange={e => setEditingFee({ ...editingFee, paymentMode: e.target.value })}
                >
                  <option value="">Not Paid</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="NEFT/RTGS">NEFT/RTGS</option>
                  <option value="Cheque">Cheque</option>
                  <option value="DD">DD</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Paid Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={editingFee.paidDate || ''}
                  onChange={e => setEditingFee({ ...editingFee, paidDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Transaction Reference</label>
                <input
                  className="form-input"
                  value={editingFee.transactionRef || ''}
                  onChange={e => setEditingFee({ ...editingFee, transactionRef: e.target.value })}
                  placeholder="UTR / Cheque No."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark" onClick={() => setEditingFee(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes ✓
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* RECORD PAYMENT MODAL */}
      {selectedFee && (
        <Modal
          isOpen={showRecord}
          onClose={() => setShowRecord(false)}
          title={`Record Payment — ${selectedFee.invoiceNo}`}
          maxWidth="480px"
        >
          <form onSubmit={handleRecordSubmit}>
            <div className="form-group">
              <label>Student & Invoice</label>
              <div style={{ padding: '10px 14px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                {selectedFee.studentName} — {selectedFee.category}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Amount Paid (₹) *</label>
                <input
                  className="form-input"
                  type="number"
                  value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Date *</label>
                <input
                  className="form-input"
                  type="date"
                  value={payForm.date}
                  onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Payment Mode *</label>
                <select
                  className="form-select"
                  value={payForm.mode}
                  onChange={e => setPayForm(f => ({ ...f, mode: e.target.value }))}
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="NEFT/RTGS">NEFT/RTGS</option>
                  <option value="Cheque">Cheque</option>
                  <option value="DD">DD</option>
                </select>
              </div>
              <div className="form-group">
                <label>Transaction / UTR Ref</label>
                <input
                  className="form-input"
                  value={payForm.ref}
                  onChange={e => setPayForm(f => ({ ...f, ref: e.target.value }))}
                  placeholder="e.g. UTR9284729"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark" onClick={() => setShowRecord(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Confirm Payment ✓
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* RECEIPT MODAL */}
      {receiptFee && (
        <Modal
          isOpen={!!receiptFee}
          onClose={() => setReceiptFee(null)}
          title="Payment Receipt"
          maxWidth="460px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                border: '1.5px dashed var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                padding: 20,
                background: 'var(--clr-bg)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <span className="badge badge-active" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
                  PAYMENT RECEIVED ✓
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 8 }}>
                  ₹{(receiptFee.paidAmount || receiptFee.amount).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                  {receiptFee.invoiceNo} · {receiptFee.category}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.86rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>Student Name:</span>
                  <span style={{ fontWeight: 600 }}>{receiptFee.studentName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>Paid Date:</span>
                  <span style={{ fontWeight: 600 }}>{receiptFee.paidDate || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>Payment Mode:</span>
                  <span style={{ fontWeight: 600 }}>{receiptFee.paymentMode || 'UPI'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--clr-text-muted)' }}>Transaction Reference:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {receiptFee.transactionRef || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => window.print()}
              >
                Print Receipt
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setReceiptFee(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE MODALS */}
      {feeToDelete && (
        <ConfirmModal
          isOpen={!!feeToDelete}
          onClose={() => setFeeToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Invoice"
          message={`Are you sure you want to permanently delete invoice "${feeToDelete.invoiceNo}" for ${feeToDelete.studentName} (₹${feeToDelete.amount.toLocaleString('en-IN')})?`}
          confirmText="Yes, Delete Invoice"
          danger
        />
      )}

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Selected Invoices"
        message={`Are you sure you want to delete all ${selectedIds.length} selected invoices?`}
        confirmText={`Delete ${selectedIds.length} Invoices`}
        danger
      />

      {/* FEES TABLE AUDIT HISTORY MODAL */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        moduleName="fees"
        title="Fee Invoices & Payments Action History"
      />
    </PageLayout>
  );
};

export default Fees;
