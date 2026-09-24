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
  RotateCcw,
  Plus,
  ShieldCheck,
  Wrench,
  X,
  History
} from 'lucide-react';

const STORAGE_KEY = 'hms_complaints_data';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'select', label: 'Select', visible: true, required: true },
  { key: 'ticketId', label: 'Ticket ID', visible: true, required: true },
  { key: 'studentName', label: 'Student', visible: true, required: true },
  { key: 'roomNumber', label: 'Room', visible: true },
  { key: 'category', label: 'Category', visible: true },
  { key: 'description', label: 'Issue Description', visible: true },
  { key: 'priority', label: 'Priority', visible: true },
  { key: 'raisedDate', label: 'Raised On', visible: true },
  { key: 'resolvedDate', label: 'Resolved On', visible: false },
  { key: 'status', label: 'Status', visible: true },
  { key: 'actions', label: 'Actions', visible: true, required: true },
];

type SortField = 'ticketId' | 'studentName' | 'roomNumber' | 'category' | 'priority' | 'raisedDate' | 'status';
type SortOrder = 'asc' | 'desc';

const CATEGORIES: ComplaintCategory[] = [
  'Electrical',
  'Plumbing',
  'Wi-Fi',
  'Hygiene',
  'Furniture',
  'Other',
];

const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    getStoredData<Complaint[]>(STORAGE_KEY, mockComplaints)
  );

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

  // Delete confirms
  const [complaintToDelete, setComplaintToDelete] = useState<Complaint | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Form states
  const initialForm = {
    studentName: 'Amit Rathore',
    roomNumber: 'A-101',
    category: 'Electrical' as ComplaintCategory,
    description: '',
    priority: 'Medium' as ComplaintPriority,
    status: 'open' as ComplaintStatus,
    remarks: '',
  };
  const [form, setForm] = useState(initialForm);

  const resetAllData = () => {
    if (confirm('Reset complaints to default demo tickets?')) {
      setComplaints(mockComplaints);
      setSelectedIds([]);
      logAuditAction(
        'complaints',
        'RESET',
        'All Complaints',
        user?.name || 'Administrator',
        'Restored default complaint tickets'
      );
    }
  };

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

  // Add Ticket
  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newC: Complaint = {
      id: `c_${Date.now()}`,
      ticketId: `#${String(Date.now()).slice(-4)}`,
      studentId: `s_${Date.now()}`,
      studentName: form.studentName.trim(),
      roomNumber: form.roomNumber.trim(),
      category: form.category,
      description: form.description.trim(),
      priority: form.priority,
      status: 'open',
      raisedDate: new Date().toISOString().slice(0, 10),
    };

    setComplaints(prev => [newC, ...prev]);
    setShowNew(false);
    setForm(initialForm);

    logAuditAction(
      'complaints',
      'CREATE',
      `Ticket ${newC.ticketId} (Room ${newC.roomNumber})`,
      user?.name || 'Administrator',
      `Created ${newC.category} maintenance ticket for ${newC.studentName} (Priority: ${newC.priority})`
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
    logAuditAction(
      'complaints',
      'BULK_DELETE',
      `${selectedIds.length} Tickets`,
      user?.name || 'Administrator',
      `Bulk deleted ${selectedIds.length} complaint tickets`
    );

    setComplaints(prev => prev.filter(c => !selectedIds.includes(c.id)));
    setSelectedIds([]);
    setShowBulkDeleteConfirm(false);
  };

  const handleBulkResolve = () => {
    logAuditAction(
      'complaints',
      'STATUS_CHANGE',
      `${selectedIds.length} Tickets`,
      user?.name || 'Administrator',
      `Bulk marked ${selectedIds.length} complaints as resolved`
    );

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
      { key: 'priority', label: 'Priority' },
      { key: 'description', label: 'Description' },
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

  const studentFullName = `${currentStudent.firstName} ${currentStudent.lastName}`.toLowerCase();
  const myComplaints = complaints.filter(c =>
    c.studentId === currentStudent.id ||
    (user?.studentId && c.studentId?.toLowerCase() === user.studentId.toLowerCase()) ||
    c.studentName.toLowerCase().includes(currentStudent.firstName.toLowerCase()) ||
    c.studentName.toLowerCase() === studentFullName
  );

  const [studentSuccess, setStudentSuccess] = useState('');
  const [showStudentNew, setShowStudentNew] = useState(false);
  const [studentForm, setStudentForm] = useState({
    category: 'Electrical' as ComplaintCategory,
    priority: 'Medium' as ComplaintPriority,
    description: '',
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
      description: studentForm.description.trim(),
      priority: studentForm.priority,
      status: 'open',
      raisedDate: new Date().toISOString().slice(0, 10),
    };

    setComplaints(prev => [newC, ...prev]);
    setShowStudentNew(false);
    setStudentForm({ category: 'Electrical', priority: 'Medium', description: '' });
    setStudentSuccess(`Ticket ${newC.ticketId} lodged successfully! Hostel maintenance team and warden have been notified.`);

    logAuditAction(
      'complaints',
      'CREATE',
      `Ticket ${newC.ticketId} (Room ${newC.roomNumber})`,
      `${currentStudent.firstName} ${currentStudent.lastName} (Student)`,
      `Lodged ${newC.category} maintenance ticket: "${newC.description.slice(0, 80)}" (Priority: ${newC.priority})`
    );
  };

  // ============================================================
  // STUDENT VIEW (Only view their complaints & lodge new complaint)
  // ============================================================
  if (isStudent) {
    const openCount = myComplaints.filter(c => c.status === 'open').length;
    const inProgressCount = myComplaints.filter(c => c.status === 'in-progress').length;
    const resolvedCount = myComplaints.filter(c => c.status === 'resolved').length;

    return (
      <PageLayout>
        <div className="student-profile-container">
          <div className="page-header-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 className="page-title" style={{ margin: 0 }}>My Complaints</h1>
                <span className="profile-pill highlight">
                  <ShieldCheck size={14} /> Student Access
                </span>
              </div>
              <p className="page-subtitle">
                Maintenance requests & issue tracking for your room ({currentStudent.roomNumber || 'A-101'})
              </p>
            </div>
            <div className="page-header-actions">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => setShowHistoryModal(true)}
                title="View maintenance complaint history"
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
                <span>Lodge New Complaint</span>
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
                <strong>Privacy & Ticket Control:</strong> You can only view maintenance requests raised by you (<strong>{currentStudent.firstName} {currentStudent.lastName}</strong>).
              </div>
              <div style={{ marginTop: 4, opacity: 0.9, fontSize: '0.84rem' }}>
                Only the warden and maintenance staff have permission to update status or mark tickets resolved.
              </div>
            </div>
          </div>

          {/* Complaint KPIs */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="kpi-card danger">
              <div className="kpi-label">
                <span>Open Tickets</span>
                <span className="icon"><AlertCircle size={20} /></span>
              </div>
              <div className="kpi-value">{openCount}</div>
              <div className="kpi-change down">Awaiting inspection</div>
            </div>

            <div className="kpi-card accent">
              <div className="kpi-label">
                <span>In Progress</span>
                <span className="icon"><Wrench size={20} /></span>
              </div>
              <div className="kpi-value">{inProgressCount}</div>
              <div className="kpi-change up">Work underway</div>
            </div>

            <div className="kpi-card green">
              <div className="kpi-label">
                <span>Resolved Tickets</span>
                <span className="icon"><CheckCircle size={20} /></span>
              </div>
              <div className="kpi-value">{resolvedCount}</div>
              <div className="kpi-change up">Completed fixes</div>
            </div>
          </div>

          {/* My Complaints Table */}
          <div className="data-table-card">
            <div className="data-table-header">
              <h3>My Support Tickets ({myComplaints.length})</h3>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Category</th>
                    <th>Issue Description</th>
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
                      <td>{c.category}</td>
                      <td style={{ maxWidth: 260, color: 'var(--clr-text)' }}>{c.description}</td>
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
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--clr-text-muted)' }}>
                        You currently have no complaints or maintenance requests. Use "+ Lodge New Complaint" if anything in your room requires attention.
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
              title="Lodge Room Maintenance Complaint"
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
                      Affected Room
                    </span>
                    <div style={{ fontWeight: 600 }}>{currentStudent.roomNumber || 'A-101'}</div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
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
                    <label>Priority *</label>
                    <select
                      className="form-select"
                      value={studentForm.priority}
                      onChange={e => setStudentForm(f => ({ ...f, priority: e.target.value as ComplaintPriority }))}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High (Urgent)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Detailed Issue Description *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={studentForm.description}
                    onChange={e => setStudentForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the issue clearly (e.g., tap dripping in bathroom, ceiling fan vibrating loudly, study desk lamp broken)…"
                    required
                  />
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
              title={`Ticket Details — ${viewComplaint.ticketId}`}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{viewComplaint.category} Issue</span>
                  {statusBadge(viewComplaint.status)}
                </div>
                <div className="profile-field-box">
                  <span className="profile-field-label">Description</span>
                  <span className="profile-field-val" style={{ fontWeight: 500 }}>{viewComplaint.description}</span>
                </div>
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
            title="My Maintenance Complaints History"
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
          <h1 className="page-title">Complaint Management</h1>
          <p className="page-subtitle">
            Resident service tickets, maintenance requests & resolution lifecycle
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
            <span>New Ticket</span>
          </button>
        </div>
      </div>

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
          change="Technician assigned"
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
            <h3>Maintenance & Service Tickets</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
              ({sorted.length} {sorted.length === 1 ? 'ticket' : 'tickets'})
            </span>
          </div>

          <div className="table-controls">
            <select
              className="search-input"
              style={{ width: 140 }}
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
              placeholder="Search ticket, student, issue…"
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
                {isColVisible('description') && <th>Issue Description</th>}
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

      {/* NEW TICKET MODAL */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Raise New Service Ticket" maxWidth="560px">
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
            <label>Detailed Issue Description *</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the defect or problem in detail..."
              required
            />
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
          maxWidth="560px"
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
              <label>Issue Description</label>
              <textarea
                className="form-textarea"
                value={editingComplaint.description}
                onChange={e => setEditingComplaint({ ...editingComplaint, description: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Resolution Remarks / Notes</label>
              <input
                className="form-input"
                value={editingComplaint.remarks || ''}
                onChange={e => setEditingComplaint({ ...editingComplaint, remarks: e.target.value })}
                placeholder="e.g. Technician replaced socket fuse on 23 Sep."
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

      {/* VIEW TICKET DETAIL MODAL */}
      {viewComplaint && (
        <Modal
          isOpen={!!viewComplaint}
          onClose={() => setViewComplaint(null)}
          title={`Ticket Details — ${viewComplaint.ticketId}`}
          maxWidth="500px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{viewComplaint.studentName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                  Room {viewComplaint.roomNumber} · {viewComplaint.category}
                </div>
              </div>
              <div>{statusBadge(viewComplaint.status)}</div>
            </div>

            <div style={{ padding: '12px 16px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                Description
              </div>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{viewComplaint.description}</div>
            </div>

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
    </PageLayout>
  );
};

export default Complaints;
