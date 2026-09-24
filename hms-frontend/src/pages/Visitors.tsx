import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import HistoryModal from '../components/ui/HistoryModal';
import ColumnVisibilityDropdown, { type ColumnConfig } from '../components/ui/ColumnVisibilityDropdown';
import BulkActionBar from '../components/ui/BulkActionBar';
import TablePagination from '../components/ui/TablePagination';
import { mockVisitors, mockStudents } from '../data/mockData';
import type { Visitor, VisitorStatus, VisitPurpose } from '../types';
import { getStoredData, setStoredData } from '../utils/storage';
import { exportToCSV } from '../utils/exportCsv';
import { logAuditAction } from '../utils/auditLogger';
import { useAuth } from '../context/AuthContext';
import {
  Download,
  Trash2,
  Edit2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Plus,
  LogOut,
  ShieldCheck,
  CheckCircle,
  Clock,
  UserCheck,
  History
} from 'lucide-react';

const STORAGE_KEY = 'hms_visitors_data';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'select', label: 'Select', visible: true, required: true },
  { key: 'visitorName', label: 'Visitor Name', visible: true, required: true },
  { key: 'phone', label: 'Phone', visible: true },
  { key: 'hostStudentName', label: 'Host Student', visible: true },
  { key: 'roomNumber', label: 'Room', visible: true },
  { key: 'purpose', label: 'Purpose', visible: true },
  { key: 'idProof', label: 'ID Proof', visible: false },
  { key: 'date', label: 'Date', visible: false },
  { key: 'checkInTime', label: 'Check-in', visible: true },
  { key: 'checkOutTime', label: 'Check-out', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'actions', label: 'Actions', visible: true, required: true },
];

type SortField = 'visitorName' | 'phone' | 'hostStudentName' | 'roomNumber' | 'purpose' | 'checkInTime' | 'checkOutTime' | 'status';
type SortOrder = 'asc' | 'desc';

const PURPOSES: VisitPurpose[] = [
  'Family Visit',
  'Academic',
  'Personal',
  'Official',
  'Other',
];

const Visitors: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>(() =>
    getStoredData<Visitor[]>(STORAGE_KEY, mockVisitors)
  );

  useEffect(() => {
    setStoredData(STORAGE_KEY, visitors);
  }, [visitors]);

  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>('checkInTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [showCheckin, setShowCheckin] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [viewVisitor, setViewVisitor] = useState<Visitor | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Delete confirms
  const [visitorToDelete, setVisitorToDelete] = useState<Visitor | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Form states
  const initialForm = {
    visitorName: '',
    phone: '',
    hostStudentName: 'Amit Rathore',
    roomNumber: 'A-101',
    purpose: 'Family Visit' as VisitPurpose,
    idProof: 'Aadhaar Card',
    date: new Date().toISOString().slice(0, 10),
    checkInTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
  const [form, setForm] = useState(initialForm);

  const resetAllData = () => {
    if (confirm('Reset visitor registry to default demo log?')) {
      setVisitors(mockVisitors);
      setSelectedIds([]);
      logAuditAction(
        'visitors',
        'RESET',
        'All Visitors',
        user?.name || 'Administrator',
        'Restored default visitor registry demo data'
      );
    }
  };

  // KPIs
  const inside = visitors.filter(v => v.status === 'inside').length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalToday = visitors.filter(v => v.date === todayStr).length;

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
  const filtered = visitors.filter(v => {
    const q = search.toLowerCase();
    const matchQ =
      v.visitorName.toLowerCase().includes(q) ||
      v.hostStudentName.toLowerCase().includes(q) ||
      v.roomNumber.toLowerCase().includes(q) ||
      v.purpose.toLowerCase().includes(q) ||
      v.phone.includes(q);

    const matchS = !statusFilter || v.status === statusFilter;
    const matchP = !purposeFilter || v.purpose === purposeFilter;
    return matchQ && matchS && matchP;
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
    if (e.target.checked) setSelectedIds(sorted.map(v => v.id));
    else setSelectedIds([]);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Quick Checkout
  const handleCheckout = (id: string) => {
    const target = visitors.find(v => v.id === id);
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setVisitors(prev =>
      prev.map(v => (v.id === id ? { ...v, status: 'checked-out', checkOutTime: nowTime } : v))
    );
    if (target) {
      logAuditAction(
        'visitors',
        'CHECK_OUT',
        target.visitorName,
        user?.name || 'Security Desk',
        `Checked out visitor for ${target.hostStudentName} (Room ${target.roomNumber}) at ${nowTime}`
      );
    }
  };

  // Add / Check-in
  const handleCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVisitor: Visitor = {
      id: `v_${Date.now()}`,
      visitorName: form.visitorName.trim(),
      phone: form.phone.trim(),
      hostStudentId: `s_${Date.now()}`,
      hostStudentName: form.hostStudentName.trim(),
      roomNumber: form.roomNumber.trim(),
      purpose: form.purpose,
      idProof: form.idProof,
      date: form.date,
      checkInTime: form.checkInTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'inside',
    };

    setVisitors(prev => [newVisitor, ...prev]);
    setShowCheckin(false);
    setForm(initialForm);
    logAuditAction(
      'visitors',
      'CHECK_IN',
      newVisitor.visitorName,
      user?.name || 'Security Desk',
      `Checked in visitor for ${newVisitor.hostStudentName} (Room ${newVisitor.roomNumber}) - Purpose: ${newVisitor.purpose}`
    );
  };

  // Edit Visitor
  const openEdit = (v: Visitor) => {
    setEditingVisitor(v);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisitor) return;

    setVisitors(prev =>
      prev.map(v => (v.id === editingVisitor.id ? editingVisitor : v))
    );
    logAuditAction(
      'visitors',
      'UPDATE',
      editingVisitor.visitorName,
      user?.name || 'Administrator',
      `Updated entry log details for visitor (${editingVisitor.purpose}, status: ${editingVisitor.status})`
    );
    setEditingVisitor(null);
  };

  // Delete
  const handleDeleteConfirm = () => {
    if (!visitorToDelete) return;
    setVisitors(prev => prev.filter(v => v.id !== visitorToDelete.id));
    setSelectedIds(prev => prev.filter(id => id !== visitorToDelete.id));
    logAuditAction(
      'visitors',
      'DELETE',
      visitorToDelete.visitorName,
      user?.name || 'Administrator',
      `Permanently deleted visitor access record (Host: ${visitorToDelete.hostStudentName}, Room ${visitorToDelete.roomNumber})`
    );
    setVisitorToDelete(null);
  };

  const handleBulkDeleteConfirm = () => {
    const count = selectedIds.length;
    setVisitors(prev => prev.filter(v => !selectedIds.includes(v.id)));
    setSelectedIds([]);
    setShowBulkDeleteConfirm(false);
    logAuditAction(
      'visitors',
      'BULK_DELETE',
      `${count} Visitor Records`,
      user?.name || 'Administrator',
      `Bulk deleted ${count} selected visitor access entries`
    );
  };

  const handleBulkCheckout = () => {
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const count = visitors.filter(v => selectedIds.includes(v.id) && v.status === 'inside').length;
    setVisitors(prev =>
      prev.map(v =>
        selectedIds.includes(v.id) && v.status === 'inside'
          ? { ...v, status: 'checked-out', checkOutTime: v.checkOutTime || nowTime }
          : v
      )
    );
    logAuditAction(
      'visitors',
      'CHECK_OUT',
      `${count} Visitors`,
      user?.name || 'Security Desk',
      `Bulk checked-out ${count} active visitors at ${nowTime}`
    );
  };

  // Export CSV
  const handleExport = () => {
    exportToCSV<Visitor>('visitors_log_export', sorted, [
      { key: 'visitorName', label: 'Visitor Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'hostStudentName', label: 'Host Student' },
      { key: 'roomNumber', label: 'Room' },
      { key: 'purpose', label: 'Purpose of Visit' },
      { key: 'idProof', label: 'ID Proof Type' },
      { key: 'date', label: 'Date' },
      { key: 'checkInTime', label: 'Check-in Time' },
      { key: 'checkOutTime', label: 'Check-out Time', format: v => v.checkOutTime || '—' },
      { key: 'status', label: 'Status' },
    ]);
  };

  const isColVisible = (key: string) => {
    const col = columns.find(c => c.key === key);
    return col ? col.visible : true;
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
  const myVisitors = visitors.filter(v =>
    v.hostStudentId === currentStudent.id ||
    (user?.studentId && v.hostStudentId?.toLowerCase() === user.studentId.toLowerCase()) ||
    v.hostStudentName.toLowerCase().includes(currentStudent.firstName.toLowerCase()) ||
    v.hostStudentName.toLowerCase() === studentFullName
  );

  const [showStudentPreReg, setShowStudentPreReg] = useState(false);
  const [studentVisitorSuccess, setStudentVisitorSuccess] = useState('');
  const [studentPreRegForm, setStudentPreRegForm] = useState({
    visitorName: '',
    phone: '',
    purpose: 'Family Visit' as VisitPurpose,
    idProof: 'Aadhaar Card',
    date: new Date().toISOString().slice(0, 10),
    expectedTime: '10:30 AM',
  });

  const handleStudentPreReg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentPreRegForm.visitorName.trim() || !studentPreRegForm.phone.trim()) return;

    const newV: Visitor = {
      id: `v_${Date.now()}`,
      visitorName: studentPreRegForm.visitorName.trim(),
      phone: studentPreRegForm.phone.trim(),
      hostStudentId: currentStudent.id,
      hostStudentName: `${currentStudent.firstName} ${currentStudent.lastName}`,
      roomNumber: currentStudent.roomNumber || 'A-101',
      purpose: studentPreRegForm.purpose,
      idProof: studentPreRegForm.idProof,
      date: studentPreRegForm.date,
      checkInTime: studentPreRegForm.expectedTime,
      status: 'inside',
    };

    setVisitors(prev => [newV, ...prev]);
    setShowStudentPreReg(false);
    setStudentPreRegForm({
      visitorName: '',
      phone: '',
      purpose: 'Family Visit',
      idProof: 'Aadhaar Card',
      date: new Date().toISOString().slice(0, 10),
      expectedTime: '10:30 AM',
    });
    setStudentVisitorSuccess(
      `Guest "${newV.visitorName}" registered successfully! Security & hostel administration can now see your visitor record.`
    );
    logAuditAction(
      'visitors',
      'REQUEST',
      newV.visitorName,
      `${currentStudent.firstName} ${currentStudent.lastName} (Student)`,
      `Pre-registered expected guest "${newV.visitorName}" for Room ${newV.roomNumber} (${newV.purpose})`
    );
  };

  // ============================================================
  // STUDENT VIEW (Only view how much visitors they have & who they are)
  // ============================================================
  if (isStudent) {
    const insideCount = myVisitors.filter(v => v.status === 'inside').length;
    const checkedOutCount = myVisitors.filter(v => v.status === 'checked-out').length;

    return (
      <PageLayout>
        <div className="student-profile-container">
          <div className="page-header-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 className="page-title" style={{ margin: 0 }}>My Visitors</h1>
                <span className="profile-pill highlight">
                  <ShieldCheck size={14} /> Student Access
                </span>
              </div>
              <p className="page-subtitle">
                Visitor accountability & security logs for your room ({currentStudent.roomNumber || 'A-101'})
              </p>
            </div>
            <div className="page-header-actions">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => setShowHistoryModal(true)}
                title="View visitor history log"
              >
                <History size={14} />
                <span>History</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowStudentPreReg(true)}
              >
                <Plus size={15} />
                <span>Pre-Register Guest</span>
              </button>
            </div>
          </div>

          {studentVisitorSuccess && (
            <div className="student-alert-success">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={18} />
                <span>{studentVisitorSuccess}</span>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setStudentVisitorSuccess('')}
                style={{ color: 'inherit' }}
              >
                ✕
              </button>
            </div>
          )}

          <div className="student-permission-banner">
            <ShieldCheck size={20} className="student-permission-icon" />
            <div>
              <div>
                <strong>Privacy & Security Boundary:</strong> You can only see visitors logged specifically for you (<strong>{currentStudent.firstName} {currentStudent.lastName}</strong>, Room {currentStudent.roomNumber || 'A-101'}).
              </div>
              <div style={{ marginTop: 4, opacity: 0.9, fontSize: '0.84rem' }}>
                Other resident students' visitors are kept private and accessible only to hostel administration and gate security.
              </div>
            </div>
          </div>

          {/* Visitor KPIs */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="kpi-card accent">
              <div className="kpi-label">
                <span>Total Visitors for Me</span>
                <span className="icon"><UserCheck size={20} /></span>
              </div>
              <div className="kpi-value">{myVisitors.length}</div>
              <div className="kpi-change up">All-time recorded guests</div>
            </div>

            <div className="kpi-card green">
              <div className="kpi-label">
                <span>Currently Inside</span>
                <span className="icon"><Clock size={20} /></span>
              </div>
              <div className="kpi-value">{insideCount}</div>
              <div className="kpi-change up">Active visitors on campus</div>
            </div>

            <div className="kpi-card warning">
              <div className="kpi-label">
                <span>Completed Visits</span>
                <span className="icon"><CheckCircle size={20} /></span>
              </div>
              <div className="kpi-value">{checkedOutCount}</div>
              <div className="kpi-change">Checked-out guests</div>
            </div>
          </div>

          {/* My Visitors Table */}
          <div className="data-table-card">
            <div className="data-table-header">
              <h3>My Guest History ({myVisitors.length})</h3>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitor Name</th>
                    <th>Phone</th>
                    <th>Purpose</th>
                    <th>ID Proof</th>
                    <th>Date</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {myVisitors.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 600, color: 'var(--clr-text)' }}>{v.visitorName}</td>
                      <td>{v.phone}</td>
                      <td>{v.purpose}</td>
                      <td>{v.idProof || 'College ID'}</td>
                      <td>{v.date}</td>
                      <td>{v.checkInTime}</td>
                      <td>{v.checkOutTime || <span style={{ color: 'var(--clr-text-muted)' }}>Currently Visiting</span>}</td>
                      <td>
                        <Badge variant={v.status === 'inside' ? 'active' : 'vacant'}>
                          {v.status === 'inside' ? 'Currently Inside' : 'Checked Out'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="View visitor details"
                          onClick={() => setViewVisitor(v)}
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {myVisitors.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--clr-text-muted)' }}>
                        No visitors have visited you yet. Use the "Pre-Register Guest" button to register an upcoming visitor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PRE-REGISTER MODAL */}
          {showStudentPreReg && (
            <Modal
              isOpen={showStudentPreReg}
              onClose={() => setShowStudentPreReg(false)}
              title="Pre-Register / Request Visitor Pass"
            >
              <form onSubmit={handleStudentPreReg}>
                <div className="form-group">
                  <label>Visitor Full Name *</label>
                  <input
                    className="form-input"
                    value={studentPreRegForm.visitorName}
                    onChange={e => setStudentPreRegForm(f => ({ ...f, visitorName: e.target.value }))}
                    placeholder="e.g. Sunil Kumar"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Visitor Phone *</label>
                    <input
                      className="form-input"
                      type="tel"
                      value={studentPreRegForm.phone}
                      onChange={e => setStudentPreRegForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="e.g. 9876543210"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Purpose of Visit</label>
                    <select
                      className="form-select"
                      value={studentPreRegForm.purpose}
                      onChange={e => setStudentPreRegForm(f => ({ ...f, purpose: e.target.value as VisitPurpose }))}
                    >
                      {PURPOSES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>ID Proof Type</label>
                    <select
                      className="form-select"
                      value={studentPreRegForm.idProof}
                      onChange={e => setStudentPreRegForm(f => ({ ...f, idProof: e.target.value }))}
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="College ID">College ID</option>
                      <option value="Driving License">Driving License</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Passport">Passport</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Expected Visit Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={studentPreRegForm.date}
                      onChange={e => setStudentPreRegForm(f => ({ ...f, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Expected Arrival Time</label>
                  <input
                    className="form-input"
                    value={studentPreRegForm.expectedTime}
                    onChange={e => setStudentPreRegForm(f => ({ ...f, expectedTime: e.target.value }))}
                    placeholder="e.g. 11:30 AM"
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-dark" onClick={() => setShowStudentPreReg(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Register Guest Pass ✓
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* VIEW VISITOR MODAL FOR STUDENT */}
          {viewVisitor && (
            <Modal
              isOpen={!!viewVisitor}
              onClose={() => setViewVisitor(null)}
              title="Visitor Pass Details"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{viewVisitor.visitorName}</h3>
                  <Badge variant={viewVisitor.status === 'inside' ? 'active' : 'vacant'}>
                    {viewVisitor.status === 'inside' ? 'Currently Inside' : 'Checked Out'}
                  </Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Phone</span>
                    <span className="profile-field-val">{viewVisitor.phone}</span>
                  </div>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Purpose</span>
                    <span className="profile-field-val">{viewVisitor.purpose}</span>
                  </div>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Date</span>
                    <span className="profile-field-val">{viewVisitor.date}</span>
                  </div>
                  <div className="profile-field-box">
                    <span className="profile-field-label">ID Proof</span>
                    <span className="profile-field-val">{viewVisitor.idProof || 'Government ID'}</span>
                  </div>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Check-In</span>
                    <span className="profile-field-val">{viewVisitor.checkInTime}</span>
                  </div>
                  <div className="profile-field-box">
                    <span className="profile-field-label">Check-Out</span>
                    <span className="profile-field-val">{viewVisitor.checkOutTime || 'Still inside'}</span>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setViewVisitor(null)}>
                    Close
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* HISTORY MODAL (STUDENT VIEW) */}
          <HistoryModal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            moduleName="visitors"
            title="My Visitor Logs & Entry History"
          />
        </div>
      </PageLayout>
    );
  }

  // ============================================================
  // ADMIN VIEW (Full master visitor log & security controls)
  // ============================================================
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon" />;
    return sortOrder === 'asc' ? <ArrowUp size={12} className="sort-icon" /> : <ArrowDown size={12} className="sort-icon" />;
  };

  return (
    <PageLayout>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Visitor Registry</h1>
          <p className="page-subtitle">
            Hostel entry access log, visitor accountability & security records
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
            title="Export visitor log to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setForm({
                ...initialForm,
                checkInTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              });
              setShowCheckin(true);
            }}
          >
            <Plus size={15} />
            <span>Guest Check-in</span>
          </button>
        </div>
      </div>

      <div className="visitor-stats-row">
        {[
          { num: inside, label: 'Currently Inside' },
          { num: totalToday || visitors.length, label: 'Today\'s Visitors' },
          { num: visitors.length, label: 'Total Logs' },
          { num: 0, label: 'Security Flags' },
        ].map((s, i) => (
          <div className="visitor-stat-card" key={i}>
            <span className="visitor-stat-num">{s.num}</span>
            <span className="visitor-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="data-table-card">
        <div className="data-table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3>Visitor Log Directory</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
              ({sorted.length} {sorted.length === 1 ? 'entry' : 'entries'})
            </span>
          </div>

          <div className="table-controls">
            <select
              className="search-input"
              style={{ width: 140 }}
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="inside">Currently Inside</option>
              <option value="checked-out">Checked Out</option>
            </select>

            <select
              className="search-input"
              style={{ width: 140 }}
              value={purposeFilter}
              onChange={e => {
                setPurposeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Purposes</option>
              {PURPOSES.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <input
              className="search-input"
              placeholder="Search visitor, student, room…"
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
                  onClick={handleBulkCheckout}
                >
                  <LogOut size={13} />
                  <span>Check Out Selected</span>
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
                {isColVisible('visitorName') && (
                  <th className="sortable" onClick={() => handleSort('visitorName')}>
                    <div className={`th-sort-wrapper ${sortField === 'visitorName' ? 'active' : ''}`}>
                      <span>Visitor Name</span>
                      {renderSortIndicator('visitorName')}
                    </div>
                  </th>
                )}
                {isColVisible('phone') && (
                  <th className="sortable" onClick={() => handleSort('phone')}>
                    <div className={`th-sort-wrapper ${sortField === 'phone' ? 'active' : ''}`}>
                      <span>Phone</span>
                      {renderSortIndicator('phone')}
                    </div>
                  </th>
                )}
                {isColVisible('hostStudentName') && (
                  <th className="sortable" onClick={() => handleSort('hostStudentName')}>
                    <div className={`th-sort-wrapper ${sortField === 'hostStudentName' ? 'active' : ''}`}>
                      <span>Host Student</span>
                      {renderSortIndicator('hostStudentName')}
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
                {isColVisible('purpose') && (
                  <th className="sortable" onClick={() => handleSort('purpose')}>
                    <div className={`th-sort-wrapper ${sortField === 'purpose' ? 'active' : ''}`}>
                      <span>Purpose</span>
                      {renderSortIndicator('purpose')}
                    </div>
                  </th>
                )}
                {isColVisible('idProof') && <th>ID Proof</th>}
                {isColVisible('date') && <th>Date</th>}
                {isColVisible('checkInTime') && (
                  <th className="sortable" onClick={() => handleSort('checkInTime')}>
                    <div className={`th-sort-wrapper ${sortField === 'checkInTime' ? 'active' : ''}`}>
                      <span>Check-in</span>
                      {renderSortIndicator('checkInTime')}
                    </div>
                  </th>
                )}
                {isColVisible('checkOutTime') && (
                  <th className="sortable" onClick={() => handleSort('checkOutTime')}>
                    <div className={`th-sort-wrapper ${sortField === 'checkOutTime' ? 'active' : ''}`}>
                      <span>Check-out</span>
                      {renderSortIndicator('checkOutTime')}
                    </div>
                  </th>
                )}
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
              {paginated.map(v => {
                const isSelected = selectedIds.includes(v.id);
                return (
                  <tr key={v.id} className={isSelected ? 'row-selected' : ''}>
                    {isColVisible('select') && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(v.id)}
                        />
                      </td>
                    )}
                    {isColVisible('visitorName') && (
                      <td style={{ fontWeight: 600 }}>{v.visitorName}</td>
                    )}
                    {isColVisible('phone') && <td>{v.phone}</td>}
                    {isColVisible('hostStudentName') && <td>{v.hostStudentName}</td>}
                    {isColVisible('roomNumber') && (
                      <td>
                        <span style={{ fontWeight: 600 }}>{v.roomNumber}</span>
                      </td>
                    )}
                    {isColVisible('purpose') && <td>{v.purpose}</td>}
                    {isColVisible('idProof') && <td>{v.idProof}</td>}
                    {isColVisible('date') && <td>{v.date}</td>}
                    {isColVisible('checkInTime') && <td>{v.checkInTime}</td>}
                    {isColVisible('checkOutTime') && <td>{v.checkOutTime ?? '—'}</td>}
                    {isColVisible('status') && (
                      <td>
                        <Badge variant={v.status === 'inside' ? 'active' : 'vacant'}>
                          {v.status === 'inside' ? 'Inside' : 'Checked Out'}
                        </Badge>
                      </td>
                    )}
                    {isColVisible('actions') && (
                      <td>
                        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                          {v.status === 'inside' && (
                            <button
                              type="button"
                              className="btn btn-outline-dark btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                              onClick={() => handleCheckout(v.id)}
                            >
                              Check Out
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-icon"
                            title="View visitor details"
                            onClick={() => setViewVisitor(v)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Edit visitor entry"
                            onClick={() => openEdit(v)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-danger-icon"
                            title="Delete log"
                            onClick={() => setVisitorToDelete(v)}
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
                    No visitor logs found.
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

      {/* CHECK-IN MODAL */}
      <Modal isOpen={showCheckin} onClose={() => setShowCheckin(false)} title="Guest Check-in" maxWidth="560px">
        <form onSubmit={handleCheckinSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Visitor Full Name *</label>
              <input
                className="form-input"
                value={form.visitorName}
                onChange={e => setForm(f => ({ ...f, visitorName: e.target.value }))}
                placeholder="Visitor's name"
                required
              />
            </div>
            <div className="form-group">
              <label>Visitor Phone *</label>
              <input
                className="form-input"
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="10-digit number"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Host Resident Student *</label>
              <input
                className="form-input"
                list="visitor-student-list"
                value={form.hostStudentName}
                onChange={e => setForm(f => ({ ...f, hostStudentName: e.target.value }))}
                placeholder="Student name"
                required
              />
              <datalist id="visitor-student-list">
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
              <label>Purpose of Visit *</label>
              <select
                className="form-select"
                value={form.purpose}
                onChange={e => setForm(f => ({ ...f, purpose: e.target.value as VisitPurpose }))}
              >
                {PURPOSES.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Identity Proof Presented *</label>
              <select
                className="form-select"
                value={form.idProof}
                onChange={e => setForm(f => ({ ...f, idProof: e.target.value }))}
              >
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="College ID">College ID</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                className="form-input"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Check-in Time</label>
              <input
                className="form-input"
                value={form.checkInTime}
                onChange={e => setForm(f => ({ ...f, checkInTime: e.target.value }))}
                placeholder="e.g. 10:30 AM"
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-dark" onClick={() => setShowCheckin(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Check In Guest ✓
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT VISITOR MODAL */}
      {editingVisitor && (
        <Modal
          isOpen={!!editingVisitor}
          onClose={() => setEditingVisitor(null)}
          title={`Edit Visitor Entry — ${editingVisitor.visitorName}`}
          maxWidth="560px"
        >
          <form onSubmit={handleEditSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Visitor Name *</label>
                <input
                  className="form-input"
                  value={editingVisitor.visitorName}
                  onChange={e => setEditingVisitor({ ...editingVisitor, visitorName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Visitor Phone *</label>
                <input
                  className="form-input"
                  value={editingVisitor.phone}
                  onChange={e => setEditingVisitor({ ...editingVisitor, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Host Resident *</label>
                <input
                  className="form-input"
                  value={editingVisitor.hostStudentName}
                  onChange={e => setEditingVisitor({ ...editingVisitor, hostStudentName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Room Number *</label>
                <input
                  className="form-input"
                  value={editingVisitor.roomNumber}
                  onChange={e => setEditingVisitor({ ...editingVisitor, roomNumber: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Purpose</label>
                <select
                  className="form-select"
                  value={editingVisitor.purpose}
                  onChange={e => setEditingVisitor({ ...editingVisitor, purpose: e.target.value as VisitPurpose })}
                >
                  {PURPOSES.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>ID Proof</label>
                <select
                  className="form-select"
                  value={editingVisitor.idProof}
                  onChange={e => setEditingVisitor({ ...editingVisitor, idProof: e.target.value })}
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="College ID">College ID</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Check-in Time</label>
                <input
                  className="form-input"
                  value={editingVisitor.checkInTime}
                  onChange={e => setEditingVisitor({ ...editingVisitor, checkInTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Check-out Time</label>
                <input
                  className="form-input"
                  value={editingVisitor.checkOutTime || ''}
                  onChange={e => setEditingVisitor({ ...editingVisitor, checkOutTime: e.target.value })}
                  placeholder="e.g. 05:45 PM"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                className="form-select"
                value={editingVisitor.status}
                onChange={e => setEditingVisitor({ ...editingVisitor, status: e.target.value as VisitorStatus })}
              >
                <option value="inside">Currently Inside</option>
                <option value="checked-out">Checked Out</option>
              </select>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark" onClick={() => setEditingVisitor(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Entry Changes ✓
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW VISITOR MODAL */}
      {viewVisitor && (
        <Modal
          isOpen={!!viewVisitor}
          onClose={() => setViewVisitor(null)}
          title="Guest Entry Details"
          maxWidth="480px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{viewVisitor.visitorName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                  Phone: {viewVisitor.phone}
                </div>
              </div>
              <div>
                <Badge variant={viewVisitor.status === 'inside' ? 'active' : 'vacant'}>
                  {viewVisitor.status === 'inside' ? 'Inside' : 'Checked Out'}
                </Badge>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { l: 'Host Resident', v: viewVisitor.hostStudentName },
                { l: 'Visiting Room', v: viewVisitor.roomNumber },
                { l: 'Purpose', v: viewVisitor.purpose },
                { l: 'ID Proof Verified', v: viewVisitor.idProof },
                { l: 'Date', v: viewVisitor.date },
                { l: 'Check-in Time', v: viewVisitor.checkInTime },
                { l: 'Check-out Time', v: viewVisitor.checkOutTime || 'Not checked out' },
              ].map(item => (
                <div key={item.l} style={{ padding: '10px 14px', background: 'var(--clr-bg)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {item.l}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.v}</div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              {viewVisitor.status === 'inside' && (
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => {
                    handleCheckout(viewVisitor.id);
                    setViewVisitor(null);
                  }}
                >
                  Check Out Now
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setViewVisitor(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE MODALS */}
      {visitorToDelete && (
        <ConfirmModal
          isOpen={!!visitorToDelete}
          onClose={() => setVisitorToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Visitor Record"
          message={`Are you sure you want to permanently delete visitor record for "${visitorToDelete.visitorName}" (Visiting ${visitorToDelete.hostStudentName} in Room ${visitorToDelete.roomNumber})?`}
          confirmText="Yes, Delete Record"
          danger
        />
      )}

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Selected Visitors"
        message={`Are you sure you want to delete all ${selectedIds.length} selected visitor records?`}
        confirmText={`Delete ${selectedIds.length} Records`}
        danger
      />

      {/* HISTORY AUDIT MODAL (ADMIN VIEW) */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        moduleName="visitors"
        title="Visitor Log & Security Action History"
      />
    </PageLayout>
  );
};

export default Visitors;
