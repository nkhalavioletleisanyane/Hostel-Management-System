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
import { mockComplaints, mockStudents } from '../data/mockData';
import type { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../types';
import { getStoredData, setStoredData } from '../utils/storage';
import { exportToCSV } from '../utils/exportCsv';
import { logAuditAction } from '../utils/auditLogger';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  Activity,
  CheckCircle,
  Download,
  Trash2,
  Edit2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  ShieldCheck,
  Wrench,
  X,
  History,
  Paperclip,
  FileText,
  UploadCloud,
  Camera,
  ExternalLink,
} from 'lucide-react';

const STORAGE_KEY = 'hms_complaints_data';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'select', label: 'Select', visible: true, required: true },
  { key: 'ticketId', label: 'Ticket ID', visible: true, required: true },
  { key: 'studentName', label: 'Student', visible: true, required: true },
  { key: 'roomNumber', label: 'Room', visible: true },
  { key: 'category', label: 'Category', visible: true },
  { key: 'title', label: 'Subject', visible: true },
  { key: 'description', label: 'Detailed Explanation', visible: true },
  { key: 'proof', label: 'Screenshot / Doc', visible: true },
  { key: 'priority', label: 'Priority', visible: true },
  { key: 'raisedDate', label: 'Raised On', visible: true },
  { key: 'resolvedDate', label: 'Resolved On', visible: false },
  { key: 'status', label: 'Status', visible: true },
  { key: 'actions', label: 'Actions', visible: true, required: true },
];

type SortField = 'ticketId' | 'studentName' | 'roomNumber' | 'category' | 'title' | 'priority' | 'raisedDate' | 'status';
type SortOrder = 'asc' | 'desc';

const CATEGORIES: ComplaintCategory[] = [
  'Other Hostel Student / Resident',
  'Hostel Residence & Facilities',
  'Room Maintenance & Repairs',
  'Mess / Food & Dining',
  'Noise & Discipline',
  'Wi-Fi & Internet',
  'Hygiene & Cleanliness',
  'Electrical',
  'Plumbing',
  'Security & Safety',
  'Furniture',
  'General Grievance / Other',
];

const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const stored = getStoredData<Complaint[]>(STORAGE_KEY, mockComplaints);
    return stored.map((c: Complaint) => {
      const match = mockComplaints.find(m => m.id === c.id);
      if (match && match.proofDocument && !c.proofDocument) {
        return {
          ...c,
          proofDocument: match.proofDocument,
          proofDocumentName: match.proofDocumentName,
          proofDocumentType: match.proofDocumentType,
        };
      }
      return c;
    });
  });

  useEffect(() => {
    setStoredData(STORAGE_KEY, complaints);
  }, [complaints]);

  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [statusTab, setStatusTab] = useState<'all' | ComplaintStatus>('all');
  const [catFilter, setCatFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>('raisedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [showNew, setShowNew] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [viewComplaint, setViewComplaint] = useState<Complaint | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Attachment Quick Lightbox Preview (for screenshot or pdf view right from table)
  const [previewAttachment, setPreviewAttachment] = useState<{
    doc: string;
    name: string;
    type: 'image' | 'pdf' | string;
    ticketId?: string;
    studentName?: string;
  } | null>(null);

  // Delete confirms
  const [complaintToDelete, setComplaintToDelete] = useState<Complaint | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // File upload errors
  const [adminUploadError, setAdminUploadError] = useState('');
  const [studentFormError, setStudentFormError] = useState('');

  // Form states
  const initialForm = {
    studentName: 'Amit Rathore',
    roomNumber: 'A-101',
    category: 'Other Hostel Student / Resident' as ComplaintCategory,
    title: '',
    description: '',
    priority: 'Medium' as ComplaintPriority,
    status: 'open' as ComplaintStatus,
    remarks: '',
    proofDocument: '',
    proofDocumentName: '',
    proofDocumentType: '' as 'image' | 'pdf' | '',
  };
  const [form, setForm] = useState(initialForm);

  // KPIs
  const openCount = complaints.filter(c => c.status === 'open').length;
  const inProgCount = complaints.filter(c => c.status === 'in-progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;

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
  const filtered = complaints.filter(c => {
    const matchTab = statusTab === 'all' || c.status === statusTab;
    const matchCat = !catFilter || c.category === catFilter;
    const matchPri = !priorityFilter || c.priority === priorityFilter;

    const q = search.toLowerCase();
    const matchQ =
      c.studentName.toLowerCase().includes(q) ||
      c.ticketId.toLowerCase().includes(q) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.roomNumber && c.roomNumber.toLowerCase().includes(q));

    return matchTab && matchCat && matchPri && matchQ;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    let aVal: any = a[sortField] || '';
    let bVal: any = b[sortField] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

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
    if (e.target.checked) setSelectedIds(sorted.map(c => c.id));
    else setSelectedIds([]);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // File Upload Helper
  const handleProofUpload = (
    file: File,
    onSuccess: (data: { doc: string; name: string; type: 'image' | 'pdf' }) => void,
    onError: (err: string) => void
  ) => {
    onError('');
    if (file.size > 5 * 1024 * 1024) {
      onError('File size exceeds 5MB limit. Please upload a smaller image or PDF document.');
      return;
    }
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isImage && !isPdf) {
      onError('Unsupported format. Please upload an image (PNG, JPG, WEBP) or PDF document.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onSuccess({
        doc: reader.result as string,
        name: file.name,
        type: isImage ? 'image' : 'pdf',
      });
    };
    reader.onerror = () => {
      onError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Add Ticket
  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) return;

    const newC: Complaint = {
      id: `c_${Date.now()}`,
      ticketId: `#${String(Date.now()).slice(-4)}`,
      studentId: `s_${Date.now()}`,
      studentName: form.studentName.trim(),
      roomNumber: form.roomNumber.trim(),
      category: form.category,
      title: form.title.trim() || undefined,
      description: form.description.trim(),
      priority: form.priority,
      status: 'open',
      raisedDate: new Date().toISOString().slice(0, 10),
      proofDocument: form.proofDocument || undefined,
      proofDocumentName: form.proofDocumentName || undefined,
      proofDocumentType: form.proofDocumentType || undefined,
    };

    setComplaints(prev => [newC, ...prev]);
    setShowNew(false);
    setForm(initialForm);
    setAdminUploadError('');

    logAuditAction(
      'complaints',
      'CREATE',
      `Ticket ${newC.ticketId} (${newC.category})`,
      user?.name || 'Administrator',
      `Created ticket for ${newC.studentName} (Priority: ${newC.priority})${newC.proofDocument ? ' with attached proof' : ''}`
    );
  };

  // Edit Ticket
  const openEdit = (comp: Complaint) => {
    setEditingComplaint(comp);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplaint) return;

    logAuditAction(
      'complaints',
      'UPDATE',
      `Ticket ${editingComplaint.ticketId}`,
      user?.name || 'Administrator',
      `Updated ticket parameters (Status: ${editingComplaint.status}, Priority: ${editingComplaint.priority})`
    );

    setComplaints(prev =>
      prev.map(c => {
        if (c.id === editingComplaint.id) {
          const isResolved = editingComplaint.status === 'resolved';
          return {
            ...editingComplaint,
            resolvedDate: isResolved
              ? editingComplaint.resolvedDate || new Date().toISOString().slice(0, 10)
              : undefined,
          };
        }
        return c;
      })
    );

    setEditingComplaint(null);
  };

  // Quick Status changer
  const handleQuickStatus = (id: string, status: ComplaintStatus) => {
    const target = complaints.find(c => c.id === id);
    if (target) {
      logAuditAction(
        'complaints',
        'STATUS_CHANGE',
        `Ticket ${target.ticketId}`,
        user?.name || 'Administrator',
        `Quick updated status from ${target.status} to ${status}`
      );
    }

    setComplaints(prev =>
      prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status,
            resolvedDate:
              status === 'resolved'
                ? c.resolvedDate || new Date().toISOString().slice(0, 10)
                : undefined,
          };
        }
        return c;
      })
    );
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon" />;
    return sortOrder === 'asc' ? <ArrowUp size={12} className="sort-icon" /> : <ArrowDown size={12} className="sort-icon" />;
  };

  // Delete
  const handleDeleteConfirm = () => {
    if (!complaintToDelete) return;

    logAuditAction(
      'complaints',
      'DELETE',
      `Ticket ${complaintToDelete.ticketId} (Room ${complaintToDelete.roomNumber})`,
      user?.name || 'Administrator',
      `Deleted complaint ticket from registry`
    );

    setComplaints(prev => prev.filter(c => c.id !== complaintToDelete.id));
    setSelectedIds(prev => prev.filter(id => id !== complaintToDelete.id));
    setComplaintToDelete(null);
  };

  const handleBulkDeleteConfirm = () => {
    const count = selectedIds.length;
    setComplaints(prev => prev.filter(c => !selectedIds.includes(c.id)));
    setSelectedIds([]);
    setShowBulkDeleteConfirm(false);

    logAuditAction(
      'complaints',
      'BULK_DELETE',
      `${count} Tickets`,
      user?.name || 'Administrator',
      `Bulk deleted ${count} complaint tickets`
    );
  };

  // Bulk Resolve
  const handleBulkResolve = () => {
    const today = new Date().toISOString().slice(0, 10);
    setComplaints(prev =>
      prev.map(c =>
        selectedIds.includes(c.id) ? { ...c, status: 'resolved', resolvedDate: today } : c
      )
    );
  };

  // Export CSV
  const handleExport = () => {
    exportToCSV<Complaint>('complaints_export', sorted, [
      { key: 'ticketId', label: 'Ticket ID' },
      { key: 'studentName', label: 'Resident Student' },
      { key: 'roomNumber', label: 'Room' },
      { key: 'category', label: 'Category' },
      { key: 'title', label: 'Subject', format: c => c.title || '—' },
      { key: 'priority', label: 'Priority' },
      { key: 'description', label: 'Detailed Description' },
      { key: 'proofDocumentName', label: 'Proof Document', format: c => c.proofDocumentName || 'No document' },
      { key: 'raisedDate', label: 'Raised On' },
      { key: 'resolvedDate', label: 'Resolved On', format: c => c.resolvedDate || '—' },
      { key: 'status', label: 'Status' },
      { key: 'remarks', label: 'Remarks', format: c => c.remarks || '' },
    ]);
  };

  const isColVisible = (key: string) => {
    const col = columns.find(c => c.key === key);
    return col ? col.visible : true;
  };

  const statusBadge = (s: ComplaintStatus) => {
    if (s === 'open') return <Badge variant="danger">Open</Badge>;
    if (s === 'in-progress') return <Badge variant="info">In Progress</Badge>;
    return <Badge variant="resolved">Resolved</Badge>;
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

  const studentFullName = `${currentStudent.firstName} ${currentStudent.lastName}`.toLowerCase().trim();
  const myComplaints = complaints.filter(c =>
    c.studentId === currentStudent.id ||
    (user?.studentId && c.studentId?.toLowerCase() === user.studentId.toLowerCase()) ||
    (currentStudent.studentId && c.studentId?.toLowerCase() === currentStudent.studentId.toLowerCase()) ||
    c.studentName.toLowerCase().trim() === studentFullName
  );

  const [studentSuccess, setStudentSuccess] = useState('');
  const [showStudentNew, setShowStudentNew] = useState(false);
  const [studentForm, setStudentForm] = useState({
    category: 'Other Hostel Student / Resident' as ComplaintCategory,
    title: '',
    priority: 'Medium' as ComplaintPriority,
    description: '',
    proofDocument: '',
    proofDocumentName: '',
    proofDocumentType: '' as 'image' | 'pdf' | '',
  });

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.description.trim()) return;

    const newTicketNum = String(complaints.length + 46).padStart(4, '0');
    const newC: Complaint = {
      id: `c_${Date.now()}`,
      ticketId: `#${newTicketNum}`,
      studentId: currentStudent.id,
      studentName: `${currentStudent.firstName} ${currentStudent.lastName}`,
      roomNumber: currentStudent.roomNumber || 'A-101',
      category: studentForm.category,
      title: studentForm.title.trim() || undefined,
      description: studentForm.description.trim(),
      priority: studentForm.priority,
      status: 'open',
      raisedDate: new Date().toISOString().slice(0, 10),
      proofDocument: studentForm.proofDocument || undefined,
      proofDocumentName: studentForm.proofDocumentName || undefined,
      proofDocumentType: studentForm.proofDocumentType || undefined,
    };

    setComplaints(prev => [newC, ...prev]);
    setShowStudentNew(false);
    setStudentForm({
      category: 'Other Hostel Student / Resident',
      title: '',
      priority: 'Medium',
      description: '',
      proofDocument: '',
      proofDocumentName: '',
      proofDocumentType: '',
    });
    setStudentFormError('');
    setStudentSuccess(
      `Complaint ${newC.ticketId} lodged successfully! Hostel warden and administration have been notified.`
    );

    logAuditAction(
      'complaints',
      'CREATE',
      `Ticket ${newC.ticketId} (${newC.category})`,
      `${currentStudent.firstName} ${currentStudent.lastName} (Student)`,
      `Lodged complaint: "${newC.title || newC.description.slice(0, 60)}" (Priority: ${newC.priority})${newC.proofDocument ? ' with uploaded proof document' : ''}`,
      currentStudent.studentId
    );
  };

  // ============================================================
  // STUDENT VIEW (View their complaints & lodge any complaint)
  // ============================================================
  if (isStudent) {
    const studentOpenCount = myComplaints.filter(c => c.status === 'open').length;
    const studentInProgressCount = myComplaints.filter(c => c.status === 'in-progress').length;
    const studentResolvedCount = myComplaints.filter(c => c.status === 'resolved').length;

    return (
      <PageLayout>
        <div className="student-profile-container">
          <div className="page-header-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 className="page-title" style={{ margin: 0 }}>My Complaints & Grievances</h1>
                <span className="profile-pill highlight">
                  <ShieldCheck size={14} /> Student Access
                </span>
              </div>
              <p className="page-subtitle">
                Lodge & track grievances regarding hostel residence, fellow students, maintenance & facilities
              </p>
            </div>
            <div className="page-header-actions">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => setShowHistoryModal(true)}
                title="View complaint history"
              >
                <History size={14} />
                <span>History</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowStudentNew(true)}
              >
                <Plus size={15} />
                <span>Lodge Complaint / Grievance</span>
              </button>
            </div>
          </div>

          {studentSuccess && (
            <div className="student-alert-success">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={18} />
                <span>{studentSuccess}</span>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setStudentSuccess('')}
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
                <strong>Privacy & Grievance Rights:</strong> You can lodge complaints regarding room maintenance, hostel facilities, fellow students/residents, food/mess, or other grievances.
              </div>
              <div style={{ marginTop: 4, opacity: 0.9, fontSize: '0.84rem' }}>
                Your complaints and attached proofs are kept confidential and accessible only to hostel administration and wardens for resolution.
              </div>
            </div>
          </div>

          {/* Complaint KPIs */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="kpi-card danger">
              <div className="kpi-label">
                <span>Open Complaints</span>
                <span className="icon"><AlertCircle size={20} /></span>
              </div>
              <div className="kpi-value">{studentOpenCount}</div>
              <div className="kpi-change down">Awaiting review by warden</div>
            </div>

            <div className="kpi-card accent">
              <div className="kpi-label">
                <span>In Progress</span>
                <span className="icon"><Wrench size={20} /></span>
              </div>
              <div className="kpi-value">{studentInProgressCount}</div>
              <div className="kpi-change up">Under investigation / action</div>
            </div>

            <div className="kpi-card green">
              <div className="kpi-label">
                <span>Resolved</span>
                <span className="icon"><CheckCircle size={20} /></span>
              </div>
              <div className="kpi-value">{studentResolvedCount}</div>
              <div className="kpi-change up">Closed & resolved</div>
            </div>
          </div>

          {/* My Complaints Table */}
          <div className="data-table-card">
            <div className="data-table-header">
              <h3>My Support & Grievance Tickets ({myComplaints.length})</h3>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Category</th>
                    <th>Subject / Title</th>
                    <th>Explanation</th>
                    <th style={{ textAlign: 'center' }}>Proof / Doc</th>
                    <th>Priority</th>
                    <th>Raised On</th>
                    <th>Resolved On</th>
                    <th>Status</th>
                    <th>Warden Remarks</th>
                    <th style={{ textAlign: 'center' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {myComplaints.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{c.ticketId}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{c.category}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--clr-text)' }}>
                        {c.title || <span style={{ color: 'var(--clr-text-muted)' }}>—</span>}
                      </td>
                      <td style={{ maxWidth: 240, color: 'var(--clr-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.description}>
                        {c.description}
                      </td>
                      <td style={{ textAlign: 'center', verticalAlign: 'middle', minWidth: 90 }}>
                        {c.proofDocument ? (
                          c.proofDocumentType === 'pdf' ? (
                            <button
                              type="button"
                              className="table-pdf-preview-btn"
                              onClick={() => setPreviewAttachment({
                                doc: c.proofDocument!,
                                name: c.proofDocumentName || 'Complaint_Document.pdf',
                                type: 'pdf',
                                ticketId: c.ticketId,
                                studentName: c.studentName,
                              })}
                              title={`Click to view PDF: ${c.proofDocumentName || 'Document'}`}
                            >
                              <div className="table-pdf-icon-wrap">
                                <FileText size={15} />
                              </div>
                              <div className="table-pdf-info">
                                <span className="table-pdf-title">{c.proofDocumentName || 'Document.pdf'}</span>
                                <span className="table-pdf-sub">View PDF ↗</span>
                              </div>
                            </button>
                          ) : (
                            <div className="table-img-preview-wrap">
                              <button
                                type="button"
                                className="table-img-thumb-btn"
                                onClick={() => setPreviewAttachment({
                                  doc: c.proofDocument!,
                                  name: c.proofDocumentName || 'Screenshot.png',
                                  type: 'image',
                                  ticketId: c.ticketId,
                                  studentName: c.studentName,
                                })}
                                title={`Click to view full screenshot: ${c.proofDocumentName || 'Screenshot'}`}
                              >
                                <img
                                  src={c.proofDocument}
                                  alt={c.proofDocumentName || 'Proof Screenshot'}
                                  className="table-img-thumb"
                                />
                                <div className="table-img-overlay">
                                  <Eye size={14} />
                                </div>
                              </button>
                              <span className="table-img-badge">Photo</span>
                            </div>
                          )
                        ) : (
                          <span className="table-no-proof">—</span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color:
                              c.priority === 'High'
                                ? 'var(--clr-danger)'
                                : c.priority === 'Medium'
                                ? 'var(--clr-warning)'
                                : 'var(--clr-text-muted)',
                          }}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td>{c.raisedDate}</td>
                      <td>{c.resolvedDate || <span style={{ color: 'var(--clr-text-muted)' }}>Pending</span>}</td>
                      <td>{statusBadge(c.status)}</td>
                      <td>{c.remarks || <span style={{ color: 'var(--clr-text-muted)' }}>—</span>}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="View ticket details"
                          onClick={() => setViewComplaint(c)}
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {myComplaints.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: 'var(--clr-text-muted)' }}>
                        You currently have no complaints logged. Use "+ Lodge Complaint / Grievance" if you have any issues regarding room maintenance, fellow students, residence facilities, or mess.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LODGE COMPLAINT MODAL */}
          {showStudentNew && (
            <Modal
              isOpen={showStudentNew}
              onClose={() => setShowStudentNew(false)}
              title="Lodge a Complaint / Grievance"
              maxWidth="600px"
            >
              <form onSubmit={handleStudentSubmit}>
                <div
                  style={{
                    background: 'var(--clr-surface-2)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--clr-border)',
                    marginBottom: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Hostel Resident
                    </span>
                    <div style={{ fontWeight: 600 }}>{currentStudent.firstName} {currentStudent.lastName}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Room / Wing
                    </span>
                    <div style={{ fontWeight: 600 }}>{currentStudent.roomNumber || 'A-101'}</div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Complaint Category *</label>
                    <select
                      className="form-select"
                      value={studentForm.category}
                      onChange={e => setStudentForm(f => ({ ...f, category: e.target.value as ComplaintCategory }))}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Urgency / Priority *</label>
                    <select
                      className="form-select"
                      value={studentForm.priority}
                      onChange={e => setStudentForm(f => ({ ...f, priority: e.target.value as ComplaintPriority }))}
                    >
                      <option value="Low">Low (Informational / Normal)</option>
                      <option value="Medium">Medium (Attention needed)</option>
                      <option value="High">High (Immediate / Urgent)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Complaint Subject / Title</label>
                  <input
                    className="form-input"
                    value={studentForm.title}
                    onChange={e => setStudentForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Late night loud disturbance by Room B-204, or Water cooler leaking in lobby"
                  />
                </div>

                <div className="form-group">
                  <label>Detailed Explanation of Complaint *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={studentForm.description}
                    onChange={e => setStudentForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Explain your complaint thoroughly: what occurred, dates/times, who or which area was involved, or specifics of the problem so the warden can take prompt action…"
                    required
                  />
                </div>

                {/* Proof / Document Upload */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Paperclip size={14} style={{ color: 'var(--clr-primary)' }} />
                    <span>Upload Supporting Proof or Document (Optional)</span>
                  </label>

                  {studentForm.proofDocument ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--clr-surface-2)',
                        border: '1px solid var(--clr-border)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        {studentForm.proofDocumentType === 'image' ? (
                          <img
                            src={studentForm.proofDocument}
                            alt="Preview"
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)' }}
                          />
                        ) : (
                          <FileText size={26} style={{ color: 'var(--clr-danger)' }} />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {studentForm.proofDocumentName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>
                            {studentForm.proofDocumentType === 'image' ? 'Image Proof Attached' : 'PDF Document Attached'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-dark btn-sm"
                        onClick={() =>
                          setStudentForm(f => ({
                            ...f,
                            proofDocument: '',
                            proofDocumentName: '',
                            proofDocumentType: '',
                          }))
                        }
                        style={{ color: 'var(--clr-danger)', borderColor: 'var(--clr-danger)' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '18px',
                        border: '2px dashed var(--clr-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        background: 'var(--clr-surface-2)',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <UploadCloud size={24} style={{ color: 'var(--clr-text-muted)', marginBottom: 6 }} />
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--clr-text)' }}>
                        Click to upload photo, screenshot, or document proof
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>
                        PNG, JPG, WEBP, or PDF (Max 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleProofUpload(
                              file,
                              res =>
                                setStudentForm(f => ({
                                  ...f,
                                  proofDocument: res.doc,
                                  proofDocumentName: res.name,
                                  proofDocumentType: res.type,
                                })),
                              err => setStudentFormError(err)
                            );
                          }
                        }}
                      />
                    </label>
                  )}
                  {studentFormError && (
                    <div style={{ color: 'var(--clr-danger)', fontSize: '0.78rem', marginTop: 4 }}>
                      {studentFormError}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-dark" onClick={() => setShowStudentNew(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Complaint ✓
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* VIEW COMPLAINT DETAILS MODAL */}
          {viewComplaint && (
            <Modal
              isOpen={!!viewComplaint}
              onClose={() => setViewComplaint(null)}
              title={`Complaint Details — ${viewComplaint.ticketId}`}
              maxWidth="560px"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{viewComplaint.category}</span>
                  {statusBadge(viewComplaint.status)}
                </div>

                {viewComplaint.title && (
                  <div style={{ padding: '10px 14px', background: 'var(--clr-surface-2)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--clr-primary)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Subject
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: 2 }}>{viewComplaint.title}</div>
                  </div>
                )}

                <div className="profile-field-box">
                  <span className="profile-field-label">Detailed Explanation</span>
                  <span className="profile-field-val" style={{ fontWeight: 500, lineHeight: 1.5 }}>
                    {viewComplaint.description}
                  </span>
                </div>

                {/* Attached Proof / Document Display */}
                {viewComplaint.proofDocument ? (
                  <div style={{ padding: '12px 14px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--clr-text-muted)' }}>
                        <Paperclip size={14} style={{ color: 'var(--clr-primary)' }} />
                        <span>Attached Supporting Proof</span>
                      </div>
                      <a
                        href={viewComplaint.proofDocument}
                        download={viewComplaint.proofDocumentName || 'complaint_proof'}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-dark btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </a>
                    </div>

                    {viewComplaint.proofDocumentType === 'image' ? (
                      <div style={{ textAlign: 'center', marginTop: 6 }}>
                        <img
                          src={viewComplaint.proofDocument}
                          alt={viewComplaint.proofDocumentName || 'Proof Document'}
                          style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'contain', border: '1px solid var(--clr-border)' }}
                        />
                        <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>
                          {viewComplaint.proofDocumentName}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)' }}>
                        <FileText size={24} style={{ color: 'var(--clr-danger)' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {viewComplaint.proofDocumentName || 'Complaint_Document.pdf'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>PDF Supporting Document</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '10px 14px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>
                    No document proof was attached with this grievance.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Priority</span>
                    <span className="profile-field-val">{viewComplaint.priority}</span>
                  </div>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Raised Date</span>
                    <span className="profile-field-val">{viewComplaint.raisedDate}</span>
                  </div>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Room Number</span>
                    <span className="profile-field-val">{viewComplaint.roomNumber}</span>
                  </div>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Resolved Date</span>
                    <span className="profile-field-val">{viewComplaint.resolvedDate || 'In Progress'}</span>
                  </div>
                </div>

                {viewComplaint.remarks && (
                  <div className="profile-field-box" style={{ borderLeft: '3px solid var(--clr-primary)' }}>
                    <span className="profile-field-label">Hostel Warden / Staff Remarks</span>
                    <span className="profile-field-val" style={{ fontWeight: 500 }}>{viewComplaint.remarks}</span>
                  </div>
                )}

                <div className="modal-footer">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setViewComplaint(null)}>
                    Close
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* Student Complaints Activity History Modal */}
          <HistoryModal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            moduleName="complaints"
            title="My Grievance & Complaints History"
          />
        </div>
      </PageLayout>
    );
  }

  // ============================================================
  // ADMIN VIEW (Master complaints directory & resolution center)
  // ============================================================
  return (
    <PageLayout>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Complaints & Grievances</h1>
          <p className="page-subtitle">
            Hostel maintenance, student conduct, residence issues & facility resolution desk
          </p>
        </div>
        <div className="page-header-actions">
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
            className="btn btn-outline-dark btn-sm"
            onClick={handleExport}
            title="Export complaints to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setForm(initialForm);
              setShowNew(true);
            }}
          >
            <Plus size={15} />
            <span>Log New Ticket</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <KpiCard
          label="Open Tickets"
          value={openCount}
          change="Pending action"
          changeType="down"
          accent="danger"
          icon={<AlertCircle size={24} />}
        />
        <KpiCard
          label="In Progress"
          value={inProgCount}
          change="Action assigned"
          changeType="up"
          accent="warning"
          icon={<Activity size={24} />}
          delay={0.1}
        />
        <KpiCard
          label="Resolved Tickets"
          value={resolvedCount}
          change="Completed"
          changeType="up"
          accent="green"
          icon={<CheckCircle size={24} />}
          delay={0.2}
        />
      </div>

      {/* FILTER TABS */}
      <div className="filter-tabs">
        {(['all', 'open', 'in-progress', 'resolved'] as const).map(tab => (
          <button
            key={tab}
            className={`filter-tab ${statusTab === tab ? 'active' : ''}`}
            onClick={() => {
              setStatusTab(tab);
              setCurrentPage(1);
            }}
          >
            {tab === 'all'
              ? `All Tickets (${complaints.length})`
              : tab === 'open'
              ? `Open (${openCount})`
              : tab === 'in-progress'
              ? `In Progress (${inProgCount})`
              : `Resolved (${resolvedCount})`}
          </button>
        ))}
      </div>

      <div className="data-table-card">
        <div className="data-table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3>Grievances & Service Directory</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
              ({sorted.length} {sorted.length === 1 ? 'ticket' : 'tickets'})
            </span>
          </div>

          <div className="table-controls">
            <select
              className="search-input"
              style={{ width: 170 }}
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
              style={{ width: 130 }}
              value={priorityFilter}
              onChange={e => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <input
              className="search-input"
              placeholder="Search ticket, student, subject, issue…"
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
                  onClick={handleBulkResolve}
                >
                  Mark Selected as Resolved
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
                {isColVisible('ticketId') && (
                  <th className="sortable" onClick={() => handleSort('ticketId')}>
                    <div className={`th-sort-wrapper ${sortField === 'ticketId' ? 'active' : ''}`}>
                      <span>Ticket ID</span>
                      {renderSortIndicator('ticketId')}
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
                {isColVisible('roomNumber') && (
                  <th className="sortable" onClick={() => handleSort('roomNumber')}>
                    <div className={`th-sort-wrapper ${sortField === 'roomNumber' ? 'active' : ''}`}>
                      <span>Room</span>
                      {renderSortIndicator('roomNumber')}
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
                {isColVisible('title') && (
                  <th className="sortable" onClick={() => handleSort('title')}>
                    <div className={`th-sort-wrapper ${sortField === 'title' ? 'active' : ''}`}>
                      <span>Subject</span>
                      {renderSortIndicator('title')}
                    </div>
                  </th>
                )}
                {isColVisible('description') && <th>Detailed Explanation</th>}
                {isColVisible('proof') && <th style={{ textAlign: 'center' }}>Screenshot / Doc</th>}
                {isColVisible('priority') && (
                  <th className="sortable" onClick={() => handleSort('priority')}>
                    <div className={`th-sort-wrapper ${sortField === 'priority' ? 'active' : ''}`}>
                      <span>Priority</span>
                      {renderSortIndicator('priority')}
                    </div>
                  </th>
                )}
                {isColVisible('raisedDate') && (
                  <th className="sortable" onClick={() => handleSort('raisedDate')}>
                    <div className={`th-sort-wrapper ${sortField === 'raisedDate' ? 'active' : ''}`}>
                      <span>Raised On</span>
                      {renderSortIndicator('raisedDate')}
                    </div>
                  </th>
                )}
                {isColVisible('resolvedDate') && <th>Resolved On</th>}
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
              {paginated.map(c => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <tr key={c.id} className={isSelected ? 'row-selected' : ''}>
                    {isColVisible('select') && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(c.id)}
                        />
                      </td>
                    )}
                    {isColVisible('ticketId') && (
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{c.ticketId}</td>
                    )}
                    {isColVisible('studentName') && <td style={{ fontWeight: 600 }}>{c.studentName}</td>}
                    {isColVisible('roomNumber') && (
                      <td>
                        <span style={{ fontWeight: 600 }}>{c.roomNumber}</span>
                      </td>
                    )}
                    {isColVisible('category') && <td>{c.category}</td>}
                    {isColVisible('title') && (
                      <td style={{ fontWeight: 600, color: 'var(--clr-text)' }}>
                        {c.title || <span style={{ color: 'var(--clr-text-muted)' }}>—</span>}
                      </td>
                    )}
                    {isColVisible('description') && (
                      <td
                        style={{
                          maxWidth: 240,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={c.description}
                      >
                        {c.description}
                      </td>
                    )}
                    {isColVisible('proof') && (
                      <td style={{ textAlign: 'center', verticalAlign: 'middle', minWidth: 90 }}>
                        {c.proofDocument ? (
                          c.proofDocumentType === 'pdf' ? (
                            <button
                              type="button"
                              className="table-pdf-preview-btn"
                              onClick={() => setPreviewAttachment({
                                doc: c.proofDocument!,
                                name: c.proofDocumentName || 'Complaint_Document.pdf',
                                type: 'pdf',
                                ticketId: c.ticketId,
                                studentName: c.studentName,
                              })}
                              title={`Click to view PDF: ${c.proofDocumentName || 'Document'}`}
                            >
                              <div className="table-pdf-icon-wrap">
                                <FileText size={16} />
                              </div>
                              <div className="table-pdf-info">
                                <span className="table-pdf-title">{c.proofDocumentName || 'Document.pdf'}</span>
                                <span className="table-pdf-sub">View PDF ↗</span>
                              </div>
                            </button>
                          ) : (
                            <div className="table-img-preview-wrap">
                              <button
                                type="button"
                                className="table-img-thumb-btn"
                                onClick={() => setPreviewAttachment({
                                  doc: c.proofDocument!,
                                  name: c.proofDocumentName || 'Screenshot.png',
                                  type: 'image',
                                  ticketId: c.ticketId,
                                  studentName: c.studentName,
                                })}
                                title={`Click to view full screenshot: ${c.proofDocumentName || 'Screenshot'}`}
                              >
                                <img
                                  src={c.proofDocument}
                                  alt={c.proofDocumentName || 'Proof Screenshot'}
                                  className="table-img-thumb"
                                />
                                <div className="table-img-overlay">
                                  <Eye size={14} />
                                </div>
                              </button>
                              <span className="table-img-badge">Photo</span>
                            </div>
                          )
                        ) : (
                          <span className="table-no-proof">—</span>
                        )}
                      </td>
                    )}
                    {isColVisible('priority') && (
                      <td>
                        <span className={`priority-${c.priority.toLowerCase()}`}>{c.priority}</span>
                      </td>
                    )}
                    {isColVisible('raisedDate') && <td>{c.raisedDate}</td>}
                    {isColVisible('resolvedDate') && <td>{c.resolvedDate || '—'}</td>}
                    {isColVisible('status') && (
                      <td>
                        <select
                          className="table-quick-select"
                          value={c.status}
                          onChange={e => handleQuickStatus(c.id, e.target.value as ComplaintStatus)}
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                    )}
                    {isColVisible('actions') && (
                      <td>
                        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-icon"
                            title="View ticket details"
                            onClick={() => setViewComplaint(c)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Edit complaint"
                            onClick={() => openEdit(c)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-danger-icon"
                            title="Delete complaint"
                            onClick={() => setComplaintToDelete(c)}
                          >
                            <Trash2 size={14} />
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
                    No complaint tickets found.
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

      {/* NEW TICKET MODAL (ADMIN) */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Log Complaint / Grievance Ticket" maxWidth="580px">
        <form onSubmit={handleNewSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Resident Student *</label>
              <input
                className="form-input"
                list="comp-student-list"
                value={form.studentName}
                onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
                placeholder="Student name"
                required
              />
              <datalist id="comp-student-list">
                {mockStudents.map(s => (
                  <option key={s.id} value={`${s.firstName} ${s.lastName}`} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label>Room Number *</label>
              <input
                className="form-input"
                value={form.roomNumber}
                onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
                placeholder="e.g. A-101"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                className="form-select"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as ComplaintCategory }))}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                className="form-select"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as ComplaintPriority }))}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Complaint Subject / Title</label>
            <input
              className="form-input"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Disturbance by adjacent room or water cooler issue"
            />
          </div>

          <div className="form-group">
            <label>Detailed Explanation of Grievance *</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the complaint, grievance, or issue in detail..."
              required
            />
          </div>

          {/* Admin Upload Proof / Document */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Paperclip size={14} style={{ color: 'var(--clr-primary)' }} />
              <span>Attach Proof or Document (Optional)</span>
            </label>
            {form.proofDocument ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--clr-surface-2)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {form.proofDocumentType === 'image' ? (
                    <img
                      src={form.proofDocument}
                      alt="Thumbnail"
                      style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                    />
                  ) : (
                    <FileText size={24} style={{ color: 'var(--clr-danger)' }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {form.proofDocumentName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>
                      {form.proofDocumentType === 'image' ? 'Image Proof' : 'PDF Document'} Attached
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => setForm(f => ({ ...f, proofDocument: '', proofDocumentName: '', proofDocumentType: '' }))}
                  style={{ color: 'var(--clr-danger)', borderColor: 'var(--clr-danger)' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  border: '2px dashed var(--clr-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: 'var(--clr-surface-2)',
                }}
              >
                <UploadCloud size={22} style={{ color: 'var(--clr-text-muted)', marginBottom: 4 }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--clr-text)' }}>
                  Click to attach image or document
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>PNG, JPG, PDF (Max 5MB)</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleProofUpload(
                        file,
                        res => setForm(f => ({ ...f, proofDocument: res.doc, proofDocumentName: res.name, proofDocumentType: res.type })),
                        err => setAdminUploadError(err)
                      );
                    }
                  }}
                />
              </label>
            )}
            {adminUploadError && (
              <div style={{ color: 'var(--clr-danger)', fontSize: '0.78rem', marginTop: 4 }}>
                {adminUploadError}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-dark" onClick={() => setShowNew(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Ticket ✓
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT TICKET MODAL */}
      {editingComplaint && (
        <Modal
          isOpen={!!editingComplaint}
          onClose={() => setEditingComplaint(null)}
          title={`Edit Ticket ${editingComplaint.ticketId}`}
          maxWidth="580px"
        >
          <form onSubmit={handleEditSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Student Name *</label>
                <input
                  className="form-input"
                  value={editingComplaint.studentName}
                  onChange={e => setEditingComplaint({ ...editingComplaint, studentName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Room Number *</label>
                <input
                  className="form-input"
                  value={editingComplaint.roomNumber}
                  onChange={e => setEditingComplaint({ ...editingComplaint, roomNumber: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  className="form-select"
                  value={editingComplaint.category}
                  onChange={e => setEditingComplaint({ ...editingComplaint, category: e.target.value as ComplaintCategory })}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  className="form-select"
                  value={editingComplaint.priority}
                  onChange={e => setEditingComplaint({ ...editingComplaint, priority: e.target.value as ComplaintPriority })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Subject / Title</label>
              <input
                className="form-input"
                value={editingComplaint.title || ''}
                onChange={e => setEditingComplaint({ ...editingComplaint, title: e.target.value })}
                placeholder="Complaint subject summary"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-select"
                  value={editingComplaint.status}
                  onChange={e => setEditingComplaint({ ...editingComplaint, status: e.target.value as ComplaintStatus })}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="form-group">
                <label>Raised Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={editingComplaint.raisedDate}
                  onChange={e => setEditingComplaint({ ...editingComplaint, raisedDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Detailed Explanation</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={editingComplaint.description}
                onChange={e => setEditingComplaint({ ...editingComplaint, description: e.target.value })}
                required
              />
            </div>

            {/* Proof Attachment in Edit Modal */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Paperclip size={14} style={{ color: 'var(--clr-primary)' }} />
                <span>Supporting Proof / Document</span>
              </label>
              {editingComplaint.proofDocument ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--clr-surface-2)',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    {editingComplaint.proofDocumentType === 'image' ? (
                      <img
                        src={editingComplaint.proofDocument}
                        alt="Proof"
                        style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      />
                    ) : (
                      <FileText size={24} style={{ color: 'var(--clr-danger)' }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {editingComplaint.proofDocumentName || 'Attached Document'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>
                        {editingComplaint.proofDocumentType === 'image' ? 'Image Proof' : 'PDF Document'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    onClick={() =>
                      setEditingComplaint({
                        ...editingComplaint,
                        proofDocument: undefined,
                        proofDocumentName: undefined,
                        proofDocumentType: undefined,
                      })
                    }
                    style={{ color: 'var(--clr-danger)', borderColor: 'var(--clr-danger)' }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    border: '2px dashed var(--clr-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: 'var(--clr-surface-2)',
                  }}
                >
                  <UploadCloud size={20} style={{ color: 'var(--clr-text-muted)', marginBottom: 4 }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Click to attach proof / document</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleProofUpload(
                          file,
                          res =>
                            setEditingComplaint({
                              ...editingComplaint,
                              proofDocument: res.doc,
                              proofDocumentName: res.name,
                              proofDocumentType: res.type,
                            }),
                          () => {}
                        );
                      }
                    }}
                  />
                </label>
              )}
            </div>

            <div className="form-group">
              <label>Resolution Remarks / Notes</label>
              <input
                className="form-input"
                value={editingComplaint.remarks || ''}
                onChange={e => setEditingComplaint({ ...editingComplaint, remarks: e.target.value })}
                placeholder="e.g. Warden discussed with resident and resolved on 23 Sep."
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark" onClick={() => setEditingComplaint(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Ticket Changes ✓
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW TICKET DETAIL MODAL (ADMIN) */}
      {viewComplaint && (
        <Modal
          isOpen={!!viewComplaint}
          onClose={() => setViewComplaint(null)}
          title={`Ticket Details — ${viewComplaint.ticketId}`}
          maxWidth="540px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{viewComplaint.studentName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                  Room {viewComplaint.roomNumber} · <span style={{ fontWeight: 600 }}>{viewComplaint.category}</span>
                </div>
              </div>
              <div>{statusBadge(viewComplaint.status)}</div>
            </div>

            {viewComplaint.title && (
              <div style={{ padding: '10px 14px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--clr-primary)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Subject
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', marginTop: 2 }}>{viewComplaint.title}</div>
              </div>
            )}

            <div style={{ padding: '12px 16px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                Detailed Explanation
              </div>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{viewComplaint.description}</div>
            </div>

            {/* Proof Attachment Display */}
            {viewComplaint.proofDocument ? (
              <div style={{ padding: '12px 16px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--clr-text-muted)' }}>
                    <Paperclip size={14} style={{ color: 'var(--clr-primary)' }} />
                    <span>Uploaded Proof / Document</span>
                  </div>
                  <a
                    href={viewComplaint.proofDocument}
                    download={viewComplaint.proofDocumentName || 'complaint_proof'}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-dark btn-sm"
                    style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </a>
                </div>

                {viewComplaint.proofDocumentType === 'image' ? (
                  <div style={{ textAlign: 'center', marginTop: 6 }}>
                    <img
                      src={viewComplaint.proofDocument}
                      alt={viewComplaint.proofDocumentName || 'Proof Document'}
                      style={{ maxHeight: 220, maxWidth: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'contain', border: '1px solid var(--clr-border)' }}
                    />
                    <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>
                      {viewComplaint.proofDocumentName}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <FileText size={24} style={{ color: 'var(--clr-danger)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {viewComplaint.proofDocumentName || 'Complaint_Document.pdf'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>PDF Supporting Document</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '10px 14px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>
                No document proof attached with this ticket.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: '10px 14px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Priority
                </div>
                <div style={{ fontWeight: 700 }}>{viewComplaint.priority}</div>
              </div>
              <div style={{ padding: '10px 14px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Raised Date
                </div>
                <div style={{ fontWeight: 700 }}>{viewComplaint.raisedDate}</div>
              </div>
            </div>

            {viewComplaint.remarks && (
              <div style={{ padding: '12px 16px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                  Resolution Remarks
                </div>
                <div style={{ fontSize: '0.88rem' }}>{viewComplaint.remarks}</div>
              </div>
            )}

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => {
                  const target = viewComplaint;
                  setViewComplaint(null);
                  openEdit(target);
                }}
              >
                <Edit2 size={13} />
                <span>Edit Ticket</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setViewComplaint(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE MODALS */}
      {complaintToDelete && (
        <ConfirmModal
          isOpen={!!complaintToDelete}
          onClose={() => setComplaintToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Ticket"
          message={`Are you sure you want to permanently delete ticket ${complaintToDelete.ticketId} (${complaintToDelete.category} for Room ${complaintToDelete.roomNumber})?`}
          confirmText="Yes, Delete Ticket"
          danger
        />
      )}

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Selected Tickets"
        message={`Are you sure you want to delete all ${selectedIds.length} selected complaints?`}
        confirmText={`Delete ${selectedIds.length} Tickets`}
        danger
      />

      {/* COMPLAINTS AUDIT ACTION HISTORY MODAL */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        moduleName="complaints"
        title="Complaints Resolution & Ticket Action History"
      />

      {/* ATTACHMENT LIGHTBOX PREVIEW MODAL */}
      {previewAttachment && (
        <div
          className="modal-backdrop fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="attachment-modal-card fade-in-up"
            style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-md, 12px)',
              border: '1px solid var(--clr-border)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
              maxWidth: previewAttachment.type === 'pdf' ? '920px' : '780px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--clr-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--clr-surface-2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                {previewAttachment.type === 'pdf' ? (
                  <FileText size={22} style={{ color: '#ef4444', flexShrink: 0 }} />
                ) : (
                  <Camera size={22} style={{ color: 'var(--clr-primary)', flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--clr-text)' }}>
                      {previewAttachment.type === 'pdf' ? 'PDF Document' : 'Screenshot / Photo'}
                    </span>
                    {previewAttachment.ticketId && (
                      <span className="badge badge-light" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {previewAttachment.ticketId}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {previewAttachment.name} {previewAttachment.studentName ? `· Uploaded by ${previewAttachment.studentName}` : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a
                  href={previewAttachment.doc}
                  download={previewAttachment.name || (previewAttachment.type === 'pdf' ? 'complaint_document.pdf' : 'complaint_screenshot.png')}
                  className="btn btn-outline-dark btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  <Download size={13} />
                  <span>Download</span>
                </a>
                {previewAttachment.type === 'pdf' && (
                  <a
                    href={previewAttachment.doc}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: '0.78rem' }}
                  >
                    <ExternalLink size={13} />
                    <span>Open in Tab</span>
                  </a>
                )}
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setPreviewAttachment(null)}
                  title="Close Preview"
                  style={{ width: 32, height: 32, borderRadius: 6 }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: previewAttachment.type === 'image' ? 'rgba(0, 0, 0, 0.08)' : 'var(--clr-bg)',
              minHeight: '280px',
            }}>
              {previewAttachment.type === 'pdf' ? (
                <iframe
                  src={previewAttachment.doc}
                  title={previewAttachment.name}
                  style={{
                    width: '100%',
                    height: '68vh',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 6,
                    background: '#fff',
                  }}
                />
              ) : (
                <img
                  src={previewAttachment.doc}
                  alt={previewAttachment.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '72vh',
                    objectFit: 'contain',
                    borderRadius: 6,
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default Complaints;
