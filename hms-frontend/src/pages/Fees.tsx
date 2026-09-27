import React, { useState, useEffect, useRef } from 'react';
import PageLayout from '../components/layout/PageLayout';
import KpiCard from '../components/ui/KpiCard';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import HistoryModal from '../components/ui/HistoryModal';
import PaymentReceiptModal, { printFeeReceipt } from '../components/ui/PaymentReceiptModal';
import ColumnVisibilityDropdown, { type ColumnConfig } from '../components/ui/ColumnVisibilityDropdown';
import BulkActionBar from '../components/ui/BulkActionBar';
import TablePagination from '../components/ui/TablePagination';
import { mockFees, mockStudents } from '../data/mockData';
import type { FeeInvoice, FeeCategory, FeeStatus, Student } from '../types';
import { getStoredData, setStoredData } from '../utils/storage';
import { exportToCSV } from '../utils/exportCsv';
import { logAuditAction } from '../utils/auditLogger';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
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
  Plus,
  Receipt,
  ShieldCheck,
  Send,
  Users,
  X,
  Eye,
  History,
  UploadCloud,
  FileText,
  Paperclip,
  Printer
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
  { key: 'document', label: 'Proof Document', visible: true },
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
  const [fees, setFees] = useState<FeeInvoice[]>(() => {
    const raw = getStoredData<FeeInvoice[]>(STORAGE_KEY, mockFees);
    const cleaned = raw.filter(
      f =>
        !(f.id.startsWith('inv_') && (f.amount === 45000 || f.amount === 18000)) &&
        !(f.studentName === 'Amit Rathore' && f.invoiceNo === 'INV-2024-001')
    );
    if (cleaned.length !== raw.length) {
      setStoredData(STORAGE_KEY, cleaned);
    }
    return cleaned;
  });

  useEffect(() => {
    setStoredData(STORAGE_KEY, fees);
  }, [fees]);

  const { user, role } = useAuth();
  const isStudent = role === 'student';
  const storedStudents = getStoredData<Student[]>('hms_students_data', mockStudents);
  const [adminSuccessMessage, setAdminSuccessMessage] = useState('');

  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [docFilter, setDocFilter] = useState('');

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
  const [previewDocFee, setPreviewDocFee] = useState<FeeInvoice | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Delete confirms
  const [feeToDelete, setFeeToDelete] = useState<FeeInvoice | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Forms
  const [payForm, setPayForm] = useState({ amount: '', date: '', mode: 'UPI', ref: '' });
  const [genForm, setGenForm] = useState(() => ({
    targetType: 'all' as 'all' | 'particular',
    selectedStudentId: storedStudents[0]?.studentId || storedStudents[0]?.id || '',
    studentName: storedStudents[0] ? `${storedStudents[0].firstName} ${storedStudents[0].lastName}` : '',
    category: 'Hostel Sem Fee' as FeeCategory,
    customCategory: '',
    amount: '12000',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    notes: '',
  }));

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
    const matchD = !docFilter || (docFilter === 'has_doc' ? !!f.receiptDocument : !f.receiptDocument);
    return matchQ && matchS && matchC && matchD;
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

  // Generate Invoice Handler / Request Fee Payment
  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(genForm.amount) || 0;
    if (amountVal <= 0) {
      alert('Please enter a valid fee amount greater than 0.');
      return;
    }

    const finalCategory = (genForm.category === 'Other' && genForm.customCategory.trim()
      ? genForm.customCategory.trim()
      : genForm.category) as FeeCategory;

    if (genForm.targetType === 'all') {
      if (storedStudents.length === 0) {
        alert('No registered students found in the database.');
        return;
      }

      const baseSeq = fees.length + 1;
      const newInvoices: FeeInvoice[] = storedStudents.map((s, idx) => {
        const studentDisplayName = `${s.firstName} ${s.lastName}`.trim() || 'Student';
        const studentIdToUse = s.studentId || s.id;
        const invSeq = String(baseSeq + idx).padStart(3, '0');
        return {
          id: `f_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          invoiceNo: `INV-2024-${invSeq}`,
          studentId: studentIdToUse,
          studentName: studentDisplayName,
          category: finalCategory,
          amount: amountVal,
          issueDate: genForm.issueDate,
          dueDate: genForm.dueDate,
          notes: genForm.notes.trim() || undefined,
          status: 'pending',
        };
      });

      setFees(prev => [...newInvoices, ...prev]);
      setShowGenerate(false);

      logAuditAction(
        'fees',
        'CREATE',
        `Broadcast Fee Request: ${finalCategory} (₹${amountVal.toLocaleString('en-IN')})`,
        user?.name || 'Administrator',
        `Requested fee payment of ₹${amountVal.toLocaleString('en-IN')} for ${finalCategory} from ALL ${storedStudents.length} students`
      );

      setAdminSuccessMessage(
        `Successfully issued "${finalCategory}" fee payment requests of ₹${amountVal.toLocaleString('en-IN')} to all ${storedStudents.length} students!`
      );
    } else {
      // Particular student from database
      const matched = storedStudents.find(
        s => s.id === genForm.selectedStudentId ||
             (s.studentId && s.studentId.toLowerCase() === genForm.selectedStudentId.toLowerCase()) ||
             `${s.firstName} ${s.lastName}`.toLowerCase() === genForm.studentName.trim().toLowerCase()
      );

      if (!matched && !genForm.studentName.trim()) {
        alert('Please select a student from the database.');
        return;
      }

      const studentDisplayName = matched ? `${matched.firstName} ${matched.lastName}`.trim() : genForm.studentName.trim();
      const studentIdToUse = matched ? (matched.studentId || matched.id) : (genForm.selectedStudentId || `s_${Date.now()}`);

      const newInvoice: FeeInvoice = {
        id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        invoiceNo: `INV-2024-${String(fees.length + 1).padStart(3, '0')}`,
        studentId: studentIdToUse,
        studentName: studentDisplayName,
        category: finalCategory,
        amount: amountVal,
        issueDate: genForm.issueDate,
        dueDate: genForm.dueDate,
        notes: genForm.notes.trim() || undefined,
        status: 'pending',
      };

      setFees(prev => [newInvoice, ...prev]);
      setShowGenerate(false);

      logAuditAction(
        'fees',
        'CREATE',
        `${newInvoice.invoiceNo} (${studentDisplayName})`,
        user?.name || 'Administrator',
        `Requested fee payment of ₹${amountVal.toLocaleString('en-IN')} for ${finalCategory} from ${studentDisplayName} (${studentIdToUse})`,
        studentIdToUse
      );

      setAdminSuccessMessage(
        `Successfully issued "${finalCategory}" fee payment request of ₹${amountVal.toLocaleString('en-IN')} to ${studentDisplayName} (${studentIdToUse})!`
      );
    }

    setGenForm({
      targetType: 'all',
      selectedStudentId: storedStudents[0]?.studentId || storedStudents[0]?.id || '',
      studentName: storedStudents[0] ? `${storedStudents[0].firstName} ${storedStudents[0].lastName}` : '',
      category: 'Hostel Sem Fee',
      customCategory: '',
      amount: '12000',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      notes: '',
    });
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

  const handleRollbackPayment = () => {
    if (!receiptFee) return;

    if (!window.confirm(`Are you sure you want to mark this invoice as unpaid for ${receiptFee.studentName}?`)) {
      return;
    }

    logAuditAction(
      'fees',
      'STATUS_CHANGE',
      `${receiptFee.invoiceNo} (${receiptFee.studentName})`,
      user?.name || 'Administrator',
      `Reverted payment of ₹${(receiptFee.paidAmount || receiptFee.amount).toLocaleString('en-IN')}. Marked invoice as pending.`
    );

    setFees(prev =>
      prev.map(f =>
        f.id === receiptFee.id
          ? {
              ...f,
              status: 'pending',
              paidDate: undefined,
              paidAmount: undefined,
              paymentMode: undefined,
              transactionRef: undefined,
            }
          : f
      )
    );

    setReceiptFee(null);
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

  const currentStudent = storedStudents.find(s =>
    (user?.studentId && s.studentId.toLowerCase() === user.studentId.toLowerCase()) ||
    (user?.id && s.id === user.id) ||
    (user?.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
    (user?.name && `${s.firstName} ${s.lastName}`.toLowerCase() === user.name.toLowerCase()) ||
    (user?.name && s.firstName.toLowerCase() === user.name.toLowerCase())
  ) || {
    id: user?.id || 's1',
    studentId: user?.studentId || 'STU-2024-001',
    firstName: user?.name ? user.name.split(' ')[0] : 'Student',
    lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : 'User',
    roomNumber: 'A-101',
  };

  const studentFullName = `${currentStudent.firstName} ${currentStudent.lastName}`.trim().toLowerCase();
  const myFees = fees.filter(f =>
    f.studentId === currentStudent.id ||
    (currentStudent.studentId && f.studentId?.toLowerCase() === currentStudent.studentId.toLowerCase()) ||
    (user?.studentId && f.studentId?.toLowerCase() === user.studentId.toLowerCase()) ||
    (currentStudent.firstName && f.studentName.toLowerCase().includes(currentStudent.firstName.toLowerCase())) ||
    (studentFullName && f.studentName.toLowerCase() === studentFullName)
  );

  const [studentPaymentSuccess, setStudentPaymentSuccess] = useState('');
  const [showPaymentRequest, setShowPaymentRequest] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [paymentForm, setPaymentForm] = useState({
    invoiceId: 'NEW_PAYMENT',
    category: 'Hostel Sem Fee' as FeeCategory,
    paymentMode: 'UPI',
    transactionRef: '',
    paidAmount: '' as number | string,
    paidDate: new Date().toISOString().slice(0, 10),
    remarks: '',
    receiptDocument: '',
    receiptDocumentName: '',
    receiptDocumentType: '' as 'image' | 'pdf' | '',
  });

  const [viewReceipt, setViewReceipt] = useState<FeeInvoice | null>(null);

  const handleFileUpload = (file: File) => {
    setDocumentError('');
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setDocumentError('File size exceeds 5MB limit. Please upload a smaller receipt document or image.');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      setDocumentError('Unsupported format. Please upload a valid fee receipt image (PNG, JPG, WEBP) or PDF document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPaymentForm(prev => ({
        ...prev,
        receiptDocument: base64,
        receiptDocumentName: file.name,
        receiptDocumentType: isImage ? 'image' : 'pdf',
      }));
    };
    reader.onerror = () => {
      setDocumentError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const openPaymentModal = (invoice?: FeeInvoice) => {
    setDocumentError('');
    if (invoice) {
      setPaymentForm({
        invoiceId: invoice.id,
        category: invoice.category,
        paymentMode: invoice.paymentMode || 'UPI',
        transactionRef: invoice.transactionRef || '',
        paidAmount: invoice.paidAmount || invoice.amount || '',
        paidDate: invoice.paidDate || new Date().toISOString().slice(0, 10),
        remarks: '',
        receiptDocument: invoice.receiptDocument || '',
        receiptDocumentName: invoice.receiptDocumentName || '',
        receiptDocumentType: (invoice.receiptDocumentType as 'image' | 'pdf' | '') || '',
      });
    } else {
      setPaymentForm({
        invoiceId: 'NEW_PAYMENT',
        category: 'Hostel Sem Fee',
        paymentMode: 'UPI',
        transactionRef: '',
        paidAmount: '',
        paidDate: new Date().toISOString().slice(0, 10),
        remarks: '',
        receiptDocument: '',
        receiptDocumentName: '',
        receiptDocumentType: '',
      });
    }
    setShowPaymentRequest(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.transactionRef.trim()) return;

    if (!paymentForm.receiptDocument) {
      setDocumentError('Fee document or image proof is required. Please upload your receipt to proceed.');
      return;
    }

    const isExistingInvoice = paymentForm.invoiceId && paymentForm.invoiceId !== 'NEW_PAYMENT' && myFees.some(f => f.id === paymentForm.invoiceId);
    const studentDisplayName = `${currentStudent.firstName} ${currentStudent.lastName}`.trim() || user?.name || 'Student';
    const studentIdToUse = currentStudent.studentId || user?.studentId || currentStudent.id;
    const amountVal = Number(paymentForm.paidAmount) || 0;

    if (isExistingInvoice) {
      setFees(prev =>
        prev.map(f => {
          if (f.id === paymentForm.invoiceId) {
            return {
              ...f,
              status: 'paid',
              paidDate: paymentForm.paidDate,
              paidAmount: amountVal || f.amount,
              paymentMode: paymentForm.paymentMode,
              transactionRef: paymentForm.transactionRef.trim(),
              receiptDocument: paymentForm.receiptDocument,
              receiptDocumentName: paymentForm.receiptDocumentName,
              receiptDocumentType: paymentForm.receiptDocumentType,
            };
          }
          return f;
        })
      );
    } else {
      const newInvoice: FeeInvoice = {
        id: `fee_${Date.now()}`,
        invoiceNo: `RCP-2024-${Math.floor(Math.random() * 800) + 100}`,
        studentId: studentIdToUse,
        studentName: studentDisplayName,
        category: paymentForm.category,
        amount: amountVal,
        issueDate: paymentForm.paidDate,
        dueDate: paymentForm.paidDate,
        paidDate: paymentForm.paidDate,
        paidAmount: amountVal,
        paymentMode: paymentForm.paymentMode,
        transactionRef: paymentForm.transactionRef.trim(),
        receiptDocument: paymentForm.receiptDocument,
        receiptDocumentName: paymentForm.receiptDocumentName,
        receiptDocumentType: paymentForm.receiptDocumentType,
        status: 'paid',
      };
      setFees(prev => [newInvoice, ...prev]);
    }

    setShowPaymentRequest(false);
    setStudentPaymentSuccess(
      `Fee receipt and payment proof uploaded successfully! Ref: ${paymentForm.transactionRef.trim()} recorded. Your receipt has been submitted for admin verification.`
    );

    const targetInv = myFees.find(f => f.id === paymentForm.invoiceId);
    logAuditAction(
      'fees',
      'PAYMENT',
      `${targetInv ? targetInv.invoiceNo : 'Fee Receipt'} (${currentStudent.firstName} ${currentStudent.lastName})`,
      `${currentStudent.firstName} ${currentStudent.lastName} (Student)`,
      `Uploaded fee receipt via ${paymentForm.paymentMode} (Ref: ${paymentForm.transactionRef.trim()}) for ₹${amountVal.toLocaleString('en-IN')} with attached proof document: ${paymentForm.receiptDocumentName || 'fee_receipt'}`,
      currentStudent.studentId
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
                Semester hostel fees, mess bills & payment receipts for {currentStudent.firstName} {currentStudent.lastName}
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
                title="Upload Fee Receipt & Proof"
              >
                <UploadCloud size={15} />
                <span>Upload Fee Receipt</span>
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
                You can view your assigned fee invoices and upload payment receipts with proof for verification by the accounts office.
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
            <div className="data-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>My Invoices & Receipts ({myFees.length})</h3>
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
                            {f.receiptDocument && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--clr-primary)', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3, background: 'rgba(99, 102, 241, 0.08)', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
                                <Paperclip size={11} /> Proof Attached
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
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn-icon"
                            title="View Receipt & Attached Proof"
                            onClick={() => {
                              if (f.status === 'paid') {
                                setReceiptFee(f);
                              } else {
                                setViewReceipt(f);
                              }
                            }}
                          >
                            <Eye size={14} />
                          </button>
                          {f.status === 'paid' && (
                            <button
                              type="button"
                              className="btn btn-outline-dark btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              onClick={() => setReceiptFee(f)}
                              title="Print / View Official Fee Receipt"
                            >
                              <Receipt size={12} />
                              <span>Receipt</span>
                            </button>
                          )}
                          {f.status !== 'paid' && (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                              onClick={() => openPaymentModal(f)}
                            >
                              Upload Receipt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {myFees.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--clr-text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <Receipt size={36} style={{ opacity: 0.35 }} />
                          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--clr-text)' }}>
                            No Fee Receipts Uploaded Yet
                          </div>
                          <div style={{ fontSize: '0.84rem', maxWidth: 420 }}>
                            You have not uploaded any fee payment receipts yet. Click the <strong>Upload Fee Receipt</strong> button to upload your payment receipt and proof.
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => openPaymentModal()}
                            style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          >
                            <UploadCloud size={14} />
                            <span>Upload Fee Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAYMENT CLEARANCE REQUEST MODAL */}
          {/* PAYMENT CLEARANCE / RECEIPT UPLOAD MODAL */}
          {showPaymentRequest && (
            <Modal
              isOpen={showPaymentRequest}
              onClose={() => setShowPaymentRequest(false)}
              title={paymentForm.invoiceId !== 'NEW_PAYMENT' ? 'Upload Payment Receipt for Invoice' : 'Upload Fee Receipt'}
            >
              <form onSubmit={handlePaymentSubmit}>
                {myFees.some(f => f.status !== 'paid') && (
                  <div className="form-group">
                    <label>Link to Pending Invoice (Optional)</label>
                    <select
                      className="form-select"
                      value={paymentForm.invoiceId}
                      onChange={e => {
                        const selectedVal = e.target.value;
                        if (selectedVal === 'NEW_PAYMENT') {
                          setPaymentForm(f => ({
                            ...f,
                            invoiceId: 'NEW_PAYMENT',
                            paidAmount: '',
                          }));
                        } else {
                          const selected = myFees.find(f => f.id === selectedVal);
                          setPaymentForm(f => ({
                            ...f,
                            invoiceId: selectedVal,
                            category: selected ? selected.category : f.category,
                            paidAmount: selected ? selected.amount : f.paidAmount,
                          }));
                        }
                      }}
                    >
                      <option value="NEW_PAYMENT">+ New Fee Receipt / Payment</option>
                      {myFees
                        .filter(f => f.status !== 'paid')
                        .map(f => (
                          <option key={f.id} value={f.id}>
                            {f.invoiceNo} — {f.category} (₹{f.amount.toLocaleString('en-IN')})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Fee Category *</label>
                  <select
                    className="form-select"
                    value={paymentForm.category}
                    onChange={e => setPaymentForm(f => ({ ...f, category: e.target.value as FeeCategory }))}
                    required
                  >
                    <option value="Hostel Sem Fee">Hostel Sem Fee</option>
                    <option value="Mess Fee">Mess Fee</option>
                    <option value="Security Deposit">Security Deposit</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Other">Other</option>
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
                      min="1"
                      placeholder="e.g. 15000"
                      value={paymentForm.paidAmount}
                      onChange={e => setPaymentForm(f => ({ ...f, paidAmount: e.target.value }))}
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
                    placeholder="e.g. Semester mess & room fee paid from bank account"
                  />
                </div>

                {/* REQUIRED FEE DOCUMENT OR IMAGE UPLOAD */}
                <div className="form-group" style={{ marginTop: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Paperclip size={14} style={{ color: 'var(--clr-primary)' }} />
                      Fee Document or Receipt Image <span style={{ color: 'var(--clr-danger)' }}>*</span>
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)' }}>
                      Required (PDF or JPG/PNG/WEBP, Max 5MB)
                    </span>
                  </label>

                  {!paymentForm.receiptDocument ? (
                    <div
                      style={{
                        border: documentError ? '2px dashed var(--clr-danger)' : '2px dashed var(--clr-primary)',
                        borderRadius: 'var(--radius-md)',
                        padding: '22px 16px',
                        textAlign: 'center',
                        background: 'rgba(99, 102, 241, 0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) {
                          handleFileUpload(e.dataTransfer.files[0]);
                        }
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg,application/pdf,.pdf"
                        style={{ display: 'none' }}
                        onChange={e => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: 'rgba(99, 102, 241, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--clr-primary)',
                          }}
                        >
                          <UploadCloud size={24} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--clr-text)' }}>
                          Click or Drag & Drop Fee Document / Image
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
                          Upload bank transfer receipt, UPI payment screenshot, or payment challan
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        border: '1px solid var(--clr-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 14px',
                        background: 'var(--clr-surface-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        {paymentForm.receiptDocumentType === 'image' ? (
                          <img
                            src={paymentForm.receiptDocument}
                            alt="Receipt Preview"
                            style={{
                              width: 52,
                              height: 52,
                              objectFit: 'cover',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--clr-border)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(239, 68, 68, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ef4444',
                              flexShrink: 0,
                            }}
                          >
                            <FileText size={26} />
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.84rem',
                              color: 'var(--clr-text)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 240,
                            }}
                          >
                            {paymentForm.receiptDocumentName || 'Payment_Proof'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--clr-success)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <CheckCircle size={12} />
                            <span>Document attached successfully</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Remove File"
                          style={{ color: 'var(--clr-danger)' }}
                          onClick={() => {
                            setPaymentForm(f => ({
                              ...f,
                              receiptDocument: '',
                              receiptDocumentName: '',
                              receiptDocumentType: '',
                            }));
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg,application/pdf,.pdf"
                        style={{ display: 'none' }}
                        onChange={e => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  )}

                  {documentError && (
                    <div style={{ color: 'var(--clr-danger)', fontSize: '0.78rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={14} />
                      <span>{documentError}</span>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--clr-bg)',
                    border: '1px solid var(--clr-border)',
                    fontSize: '0.78rem',
                    color: 'var(--clr-text-muted)',
                    marginTop: 10,
                  }}
                >
                  ℹ️ The uploaded document and transaction details will be verified by the Hostel Warden and Accounts Office.
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-dark" onClick={() => setShowPaymentRequest(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <UploadCloud size={15} />
                    <span>Upload Fee Receipt ✓</span>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--clr-border)', paddingBottom: 12 }}>
                  <Logo size="sm" showSubtitle subtitle="Official Fee Clearance Document" />
                  <Badge variant={viewReceipt.status === 'paid' ? 'active' : 'pending'}>
                    {viewReceipt.status.toUpperCase()}
                  </Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{viewReceipt.category}</h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', fontFamily: 'monospace' }}>
                    {viewReceipt.invoiceNo}
                  </span>
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

                {/* Uploaded Receipt Document / Image Preview */}
                {viewReceipt.receiptDocument && (
                  <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 14, marginTop: 4 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--clr-text)' }}>
                      <Paperclip size={15} style={{ color: 'var(--clr-primary)' }} />
                      <span>Uploaded Payment Proof / Document:</span>
                    </div>

                    {viewReceipt.receiptDocumentType === 'image' ? (
                      <div style={{ textAlign: 'center', background: 'var(--clr-surface-2)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                        <img
                          src={viewReceipt.receiptDocument}
                          alt={viewReceipt.receiptDocumentName || 'Payment Proof'}
                          style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
                        />
                        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 8 }}>
                          <a
                            href={viewReceipt.receiptDocument}
                            download={viewReceipt.receiptDocumentName || 'fee_receipt_proof.png'}
                            className="btn btn-outline btn-sm"
                          >
                            <Download size={13} /> Download Proof Image
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: 'var(--clr-surface-2)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--clr-border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <FileText size={26} style={{ color: '#ef4444' }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                              {viewReceipt.receiptDocumentName || 'fee_payment_document.pdf'}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)' }}>Verified PDF Document</div>
                          </div>
                        </div>
                        <a
                          href={viewReceipt.receiptDocument}
                          download={viewReceipt.receiptDocumentName || 'fee_receipt_document.pdf'}
                          className="btn btn-primary btn-sm"
                        >
                          <Download size={13} /> Download PDF
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {viewReceipt.status === 'paid' && (
                    <button
                      type="button"
                      className="btn btn-outline-dark btn-sm"
                      onClick={() => {
                        setReceiptFee(viewReceipt);
                        setViewReceipt(null);
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Receipt size={13} />
                      <span>Official Receipt Voucher</span>
                    </button>
                  )}
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
            title="Request fee payment from all students or a particular student"
          >
            <Plus size={15} />
            <span>Request Fee / New Invoice</span>
          </button>
        </div>
      </div>

      {adminSuccessMessage && (
        <div className="student-alert-success" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={18} />
            <span>{adminSuccessMessage}</span>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setAdminSuccessMessage('')}
            style={{ color: 'inherit' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

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

            <select
              className="search-input"
              style={{ width: 140 }}
              value={docFilter}
              onChange={e => {
                setDocFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Documents</option>
              <option value="has_doc">Has Proof</option>
              <option value="no_doc">No Proof</option>
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
                {isColVisible('document') && <th style={{ textAlign: 'center' }}>Proof</th>}
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
                    {isColVisible('document') && (
                      <td style={{ textAlign: 'center' }}>
                        {f.receiptDocument ? (
                          <button
                            type="button"
                            className="badge badge-active"
                            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--clr-primary)', border: 'none', padding: '4px 8px' }}
                            onClick={() => setPreviewDocFee(f)}
                            title="View Attached Proof Document"
                          >
                            <Paperclip size={12} />
                            <span>View</span>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                    )}
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
                          {f.receiptDocument && (
                            <button
                              type="button"
                              className="btn-icon"
                              title="View Document"
                              onClick={() => setPreviewDocFee(f)}
                            >
                              <Eye size={13} />
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

      {/* GENERATE INVOICE / REQUEST FEE PAYMENT MODAL */}
      <Modal
        isOpen={showGenerate}
        onClose={() => setShowGenerate(false)}
        title="Request Fee Payment / Issue Invoices"
        maxWidth="640px"
      >
        <form onSubmit={handleGenerateSubmit}>
          {/* Target Audience: All Students vs Particular Student */}
          <div className="form-group">
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Send Fee Payment Request To: *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: genForm.targetType === 'all' ? '2px solid var(--clr-primary)' : '1px solid var(--clr-border)',
                  background: genForm.targetType === 'all' ? 'rgba(99, 102, 241, 0.08)' : 'var(--clr-surface)',
                  cursor: 'pointer',
                  fontWeight: genForm.targetType === 'all' ? 600 : 400,
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name="feeTarget"
                  checked={genForm.targetType === 'all'}
                  onChange={() => setGenForm(f => ({ ...f, targetType: 'all' }))}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem' }}>
                    <Users size={14} style={{ color: 'var(--clr-primary)' }} />
                    <span>All Students</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)' }}>
                    Send to all {storedStudents.length} registered students
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: genForm.targetType === 'particular' ? '2px solid var(--clr-primary)' : '1px solid var(--clr-border)',
                  background: genForm.targetType === 'particular' ? 'rgba(99, 102, 241, 0.08)' : 'var(--clr-surface)',
                  cursor: 'pointer',
                  fontWeight: genForm.targetType === 'particular' ? 600 : 400,
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name="feeTarget"
                  checked={genForm.targetType === 'particular'}
                  onChange={() => setGenForm(f => ({ ...f, targetType: 'particular' }))}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem' }}>
                    <ShieldCheck size={14} style={{ color: 'var(--clr-primary)' }} />
                    <span>Particular Student</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)' }}>
                    Select specific student from database
                  </div>
                </div>
              </label>
            </div>
          </div>

          {genForm.targetType === 'all' ? (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.06)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                fontSize: '0.82rem',
                color: 'var(--clr-text)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <Users size={18} style={{ color: 'var(--clr-primary)', flexShrink: 0 }} />
              <span>
                Broadcast mode: This will generate an individual pending invoice for <strong>all {storedStudents.length} students</strong> currently in the database.
              </span>
            </div>
          ) : (
            <div className="form-group">
              <label>Select Particular Student from Database *</label>
              <select
                className="form-select"
                value={genForm.selectedStudentId}
                onChange={e => {
                  const sId = e.target.value;
                  const found = storedStudents.find(s => (s.studentId || s.id) === sId || s.id === sId);
                  setGenForm(f => ({
                    ...f,
                    selectedStudentId: sId,
                    studentName: found ? `${found.firstName} ${found.lastName}` : f.studentName,
                  }));
                }}
                required
              >
                <option value="">-- Choose a student ({storedStudents.length} available) --</option>
                {storedStudents.map(s => (
                  <option key={s.id} value={s.studentId || s.id}>
                    {s.firstName} {s.lastName} ({s.studentId} • Room: {s.roomNumber || 'Unassigned'} • {s.course || 'Resident'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Fee Category / Purpose *</label>
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
              <label>Amount to Pay (₹) *</label>
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

          {genForm.category === 'Other' && (
            <div className="form-group">
              <label>Specify Fee Purpose / Title *</label>
              <input
                className="form-input"
                value={genForm.customCategory}
                onChange={e => setGenForm(f => ({ ...f, customCategory: e.target.value }))}
                placeholder="e.g. Annual Fest Dinner, Gym Membership, Damage Penalty..."
                required
              />
            </div>
          )}

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
            <label>Payment Instructions / Notes for Student(s)</label>
            <textarea
              className="form-textarea"
              value={genForm.notes}
              onChange={e => setGenForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Please clear this fee before the deadline via UPI or at the Warden desk."
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-dark" onClick={() => setShowGenerate(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Send size={14} />
              <span>
                {genForm.targetType === 'all'
                  ? `Send Fee Request to All (${storedStudents.length}) Students ✓`
                  : 'Send Fee Request to Student ✓'}
              </span>
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
              {selectedFee.receiptDocument && (
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setPreviewDocFee(selectedFee)}
                  >
                    <Paperclip size={13} /> View Attached Payment Proof
                  </button>
                </div>
              )}
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

      {/* OFFICIAL PAYMENT RECEIPT MODAL */}
      <PaymentReceiptModal
        isOpen={!!receiptFee}
        onClose={() => setReceiptFee(null)}
        invoice={receiptFee}
        allStudents={storedStudents}
        isAdmin={!isStudent}
        onRollbackPayment={() => handleRollbackPayment()}
      />

      {/* PREVIEW DOCUMENT MODAL */}
      {previewDocFee && (
        <Modal
          isOpen={!!previewDocFee}
          onClose={() => setPreviewDocFee(null)}
          title={`Proof Document — ${previewDocFee.invoiceNo}`}
          maxWidth="600px"
        >
          <div style={{ padding: '10px 0' }}>
            <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Student</div>
                <div style={{ fontWeight: 600 }}>{previewDocFee.studentName}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Amount</div>
                <div style={{ fontWeight: 600, color: 'var(--clr-primary)' }}>₹{previewDocFee.amount.toLocaleString('en-IN')}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Status</div>
                <Badge variant={previewDocFee.status === 'paid' ? 'active' : previewDocFee.status === 'pending' ? 'pending' : 'danger'}>
                  {previewDocFee.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {previewDocFee.receiptDocumentType === 'image' ? (
              <div style={{ textAlign: 'center', background: 'var(--clr-surface-2)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                <img
                  src={previewDocFee.receiptDocument}
                  alt="Proof Document"
                  style={{ maxWidth: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
                />
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
                  <a
                    href={previewDocFee.receiptDocument}
                    download={previewDocFee.receiptDocumentName || 'proof_document.png'}
                    className="btn btn-primary btn-sm"
                  >
                    <Download size={14} /> Download Image
                  </a>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: 'var(--clr-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--clr-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <FileText size={32} style={{ color: '#ef4444' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {previewDocFee.receiptDocumentName || 'payment_proof.pdf'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>PDF Verification Document</div>
                  </div>
                </div>
                <a
                  href={previewDocFee.receiptDocument}
                  download={previewDocFee.receiptDocumentName || 'payment_proof.pdf'}
                  className="btn btn-primary"
                >
                  <Download size={15} /> Download PDF
                </a>
              </div>
            )}
          </div>
          <div className="modal-footer" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={() => setPreviewDocFee(null)}
            >
              Close Preview
            </button>
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
