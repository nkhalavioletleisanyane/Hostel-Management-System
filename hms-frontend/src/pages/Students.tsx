import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import KpiCard from '../components/ui/KpiCard';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import HistoryModal from '../components/ui/HistoryModal';
import ColumnVisibilityDropdown, { type ColumnConfig } from '../components/ui/ColumnVisibilityDropdown';
import BulkActionBar from '../components/ui/BulkActionBar';
import TablePagination from '../components/ui/TablePagination';
import { mockStudents } from '../data/mockData';
import type { Student } from '../types';
import { getStoredData, setStoredData } from '../utils/storage';
import { exportToCSV } from '../utils/exportCsv';
import { logAuditAction } from '../utils/auditLogger';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  CheckCircle,
  Key,
  Download,
  Trash2,
  Edit2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  ShieldCheck,
  Lock,
  Phone,
  Mail,
  UserCheck,
  AlertCircle,
  Clock,
  GraduationCap,
  X,
  PhoneCall,
  History,
  Camera,
  EyeOff,
  Copy,
  RefreshCw
} from 'lucide-react';

const STORAGE_KEY = 'hms_students_data';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'select', label: 'Select', visible: true, required: true },
  { key: 'student', label: 'Student', visible: true, required: true },
  { key: 'studentId', label: 'Student ID', visible: true },
  { key: 'course', label: 'Course & Sem', visible: true },
  { key: 'department', label: 'Department', visible: false },
  { key: 'rollNumber', label: 'Roll No', visible: false },
  { key: 'room', label: 'Room & Block', visible: true },
  { key: 'phone', label: 'Phone', visible: true },
  { key: 'emergency', label: 'Emergency Contact', visible: false },
  { key: 'password', label: 'Password', visible: false },
  { key: 'status', label: 'Status', visible: true },
  { key: 'actions', label: 'Actions', visible: true, required: true },
];

type SortField = 'name' | 'studentId' | 'course' | 'room' | 'status' | 'phone';
type SortOrder = 'asc' | 'desc';

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(() =>
    getStoredData<Student[]>(STORAGE_KEY, mockStudents)
  );

  useEffect(() => {
    setStoredData(STORAGE_KEY, students);
  }, [students]);

  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Password View & Reset Modal States
  const [passwordStudent, setPasswordStudent] = useState<Student | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Helper to fetch effective password for any student
  const getStudentPassword = (st: Student): string => {
    if (st.password) return st.password;
    try {
      const regStr = localStorage.getItem('hms_registered_users');
      if (regStr) {
        const regMap = JSON.parse(regStr);
        if (st.email && regMap[st.email.toLowerCase()]?.password) {
          return regMap[st.email.toLowerCase()].password;
        }
        if (st.studentId && regMap[st.studentId.toLowerCase()]?.password) {
          return regMap[st.studentId.toLowerCase()].password;
        }
      }
    } catch (e) {
      console.error('Error fetching student password:', e);
    }
    return 'stu123';
  };

  const openPasswordModal = (st: Student) => {
    setPasswordStudent(st);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setNewPasswordInput('');
    setPasswordSuccess('');
    setPasswordError('');
    setCopiedNotification(false);
  };

  const handleCopyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(`Stu#${res}`);
    setPasswordError('');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordStudent) return;
    const cleanNew = newPasswordInput.trim();
    if (!cleanNew) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (cleanNew.length < 4) {
      setPasswordError('Password should be at least 4 characters long.');
      return;
    }

    // 1. Update students state & storage
    const updated = students.map(s => {
      if (s.id === passwordStudent.id) {
        return { ...s, password: cleanNew };
      }
      return s;
    });
    setStudents(updated);
    setStoredData(STORAGE_KEY, updated);

    // 2. Synchronize with hms_registered_users so student login works immediately
    try {
      const regStr = localStorage.getItem('hms_registered_users');
      const regMap = regStr ? JSON.parse(regStr) : {};
      const keysToSync = [
        passwordStudent.email?.toLowerCase(),
        passwordStudent.studentId?.toLowerCase(),
        passwordStudent.id?.toLowerCase(),
      ].filter(Boolean);

      keysToSync.forEach(k => {
        if (regMap[k]) {
          regMap[k].password = cleanNew;
        } else {
          regMap[k] = {
            password: cleanNew,
            user: {
              id: passwordStudent.id,
              name: `${passwordStudent.firstName} ${passwordStudent.lastName}`,
              email: passwordStudent.email,
              phone: passwordStudent.phone,
              role: 'student',
              studentId: passwordStudent.studentId,
              photo: passwordStudent.photo || passwordStudent.avatar,
            },
          };
        }
      });
      localStorage.setItem('hms_registered_users', JSON.stringify(regMap));
    } catch (err) {
      console.error('Error syncing password to registered users:', err);
    }

    // 3. Log audit action
    logAuditAction(
      'students',
      'UPDATE',
      `${passwordStudent.firstName} ${passwordStudent.lastName} (${passwordStudent.studentId})`,
      user?.name || 'Administrator',
      `Admin reset account password for student ${passwordStudent.studentId}`
    );

    // Update targets in memory
    setPasswordStudent(prev => (prev ? { ...prev, password: cleanNew } : null));
    setViewStudent(prev => (prev && prev.id === passwordStudent.id ? { ...prev, password: cleanNew } : prev));

    setPasswordSuccess(
      `Password for ${passwordStudent.firstName} ${passwordStudent.lastName} has been successfully updated to "${cleanNew}"!`
    );
    setPasswordError('');
    setNewPasswordInput('');
  };

  // Deletion confirm
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Add / Edit form states
  const initialForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Computer Applications',
    rollNumber: '',
    course: 'MCA',
    semester: 'Sem 1',
    roomNumber: '',
    blockName: 'Block A',
    status: 'unassigned' as Student['status'],
    emergencyContact: '',
    emergencyPhone: '',
    photo: '',
    password: 'stu123',
  };
  const [form, setForm] = useState(initialForm);

  const handleDirectPhotoUpload = (studentId: string, file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setStudents(prev =>
        prev.map(s => (s.id === studentId ? { ...s, photo: base64 } : s))
      );
      const target = students.find(s => s.id === studentId);
      if (target) {
        logAuditAction(
          'students',
          'UPDATE',
          `${target.firstName} ${target.lastName} (${target.studentId})`,
          user?.name || 'Administrator',
          `Uploaded new face photo for student ${target.firstName} ${target.lastName}`
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered and Sorted list
  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchQ =
      fullName.includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.roomNumber && s.roomNumber.toLowerCase().includes(q)) ||
      (s.course && s.course.toLowerCase().includes(q)) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q));

    const matchS = !statusFilter || s.status === statusFilter;
    const matchC = !courseFilter || s.course === courseFilter;
    return matchQ && matchS && matchC;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = '';
    let bVal = '';

    if (sortField === 'name') {
      aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
      bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
    } else if (sortField === 'studentId') {
      aVal = a.studentId.toLowerCase();
      bVal = b.studentId.toLowerCase();
    } else if (sortField === 'course') {
      aVal = `${a.course} ${a.semester}`.toLowerCase();
      bVal = `${b.course} ${b.semester}`.toLowerCase();
    } else if (sortField === 'room') {
      aVal = (a.roomNumber || 'zzz').toLowerCase();
      bVal = (b.roomNumber || 'zzz').toLowerCase();
    } else if (sortField === 'phone') {
      aVal = a.phone;
      bVal = b.phone;
    } else if (sortField === 'status') {
      aVal = a.status;
      bVal = b.status;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated records
  const isAll = pageSize >= 9999;
  const paginated = isAll
    ? sorted
    : sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = sorted.map(s => s.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Add Handler
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const initials = (
      (form.firstName[0] || 'S') + (form.lastName[0] || 'T')
    ).toUpperCase();
    const studentPassword = form.password?.trim() || 'stu123';
    const newStu: Student = {
      id: `s_${Date.now()}`,
      studentId: `STU-2024-${String(students.length + 1).padStart(3, '0')}`,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      department: form.department,
      rollNumber: form.rollNumber.trim(),
      course: form.course,
      semester: form.semester,
      roomNumber: form.roomNumber.trim() || undefined,
      blockName: form.roomNumber.trim() ? form.blockName : undefined,
      emergencyContact: form.emergencyContact.trim(),
      emergencyPhone: form.emergencyPhone.trim(),
      status: form.status,
      avatar: initials,
      photo: form.photo || undefined,
      checkInDate: form.roomNumber.trim() ? new Date().toISOString().slice(0, 10) : undefined,
      password: studentPassword,
    };

    setStudents(prev => [newStu, ...prev]);
    setShowAdd(false);
    setForm(initialForm);

    try {
      const regStr = localStorage.getItem('hms_registered_users');
      const regMap = regStr ? JSON.parse(regStr) : {};
      const userPayload = {
        password: studentPassword,
        user: {
          id: newStu.id,
          name: `${newStu.firstName} ${newStu.lastName}`,
          email: newStu.email,
          phone: newStu.phone,
          role: 'student' as const,
          studentId: newStu.studentId,
          photo: newStu.photo || newStu.avatar,
        },
      };
      regMap[newStu.email.toLowerCase()] = userPayload;
      regMap[newStu.studentId.toLowerCase()] = userPayload;
      localStorage.setItem('hms_registered_users', JSON.stringify(regMap));
    } catch (err) {
      console.error('Error saving registered user account:', err);
    }

    logAuditAction(
      'students',
      'CREATE',
      `${newStu.firstName} ${newStu.lastName} (${newStu.studentId})`,
      user?.name || 'Administrator',
      `Enrolled resident student in ${newStu.course} (${newStu.roomNumber ? 'Room ' + newStu.roomNumber : 'Unassigned'})`
    );
  };

  // Open Edit Modal
  const openEdit = (stu: Student) => {
    setEditingStudent(stu);
    setForm({
      firstName: stu.firstName,
      lastName: stu.lastName,
      email: stu.email,
      phone: stu.phone,
      department: stu.department || '',
      rollNumber: stu.rollNumber || '',
      course: stu.course,
      semester: stu.semester,
      roomNumber: stu.roomNumber || '',
      blockName: stu.blockName || 'Block A',
      status: stu.status,
      emergencyContact: stu.emergencyContact || '',
      emergencyPhone: stu.emergencyPhone || '',
      photo: stu.photo || '',
      password: stu.password || getStudentPassword(stu),
    });
  };

  // Save Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const initials = (
      (form.firstName[0] || 'S') + (form.lastName[0] || 'T')
    ).toUpperCase();
    const updatedPassword = form.password?.trim() || editingStudent.password || 'stu123';

    setStudents(prev =>
      prev.map(s => {
        if (s.id === editingStudent.id) {
          return {
            ...s,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            department: form.department,
            rollNumber: form.rollNumber.trim(),
            course: form.course,
            semester: form.semester,
            roomNumber: form.roomNumber.trim() || undefined,
            blockName: form.roomNumber.trim() ? form.blockName : undefined,
            emergencyContact: form.emergencyContact.trim(),
            emergencyPhone: form.emergencyPhone.trim(),
            status: form.status,
            avatar: initials,
            photo: form.photo !== undefined ? form.photo : s.photo,
            password: updatedPassword,
          };
        }
        return s;
      })
    );

    // Sync updated password to registered users
    try {
      const regStr = localStorage.getItem('hms_registered_users');
      const regMap = regStr ? JSON.parse(regStr) : {};
      const keys = [
        form.email.trim().toLowerCase(),
        editingStudent.email?.toLowerCase(),
        editingStudent.studentId?.toLowerCase(),
        editingStudent.id?.toLowerCase(),
      ].filter(Boolean);

      keys.forEach(k => {
        if (regMap[k]) {
          regMap[k].password = updatedPassword;
        }
      });
      localStorage.setItem('hms_registered_users', JSON.stringify(regMap));
    } catch (err) {
      console.error('Error syncing updated password:', err);
    }

    logAuditAction(
      'students',
      'UPDATE',
      `${form.firstName} ${form.lastName} (${editingStudent.studentId})`,
      user?.name || 'Administrator',
      `Updated resident record (Course: ${form.course}, Room: ${form.roomNumber || 'None'}, Status: ${form.status})`
    );

    setEditingStudent(null);
  };

  // Single Delete
  const handleDeleteConfirm = () => {
    if (!studentToDelete) return;
    setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
    setSelectedIds(prev => prev.filter(id => id !== studentToDelete.id));

    logAuditAction(
      'students',
      'DELETE',
      `${studentToDelete.firstName} ${studentToDelete.lastName} (${studentToDelete.studentId})`,
      user?.name || 'Administrator',
      `Deleted student record from registry`
    );

    setStudentToDelete(null);
  };

  // Bulk Delete
  const handleBulkDeleteConfirm = () => {
    logAuditAction(
      'students',
      'BULK_DELETE',
      `${selectedIds.length} Students`,
      user?.name || 'Administrator',
      `Bulk deleted ${selectedIds.length} student records from database`
    );

    setStudents(prev => prev.filter(s => !selectedIds.includes(s.id)));
    setSelectedIds([]);
    setShowBulkDeleteConfirm(false);
  };

  // Bulk Status Change
  const handleBulkStatusChange = (newStatus: Student['status']) => {
    setStudents(prev =>
      prev.map(s => (selectedIds.includes(s.id) ? { ...s, status: newStatus } : s))
    );
  };

  // Quick Status change directly from cell
  const handleQuickStatusChange = (id: string, newStatus: Student['status']) => {
    setStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  // Export CSV
  const handleExport = () => {
    exportToCSV<Student>('students_export', sorted, [
      { key: 'studentId', label: 'Student ID' },
      {
        key: 'name',
        label: 'Full Name',
        format: s => `${s.firstName} ${s.lastName}`,
      },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'course', label: 'Course' },
      { key: 'semester', label: 'Semester' },
      { key: 'department', label: 'Department' },
      { key: 'rollNumber', label: 'Roll Number' },
      {
        key: 'room',
        label: 'Room Allocation',
        format: s => (s.roomNumber ? `${s.roomNumber} (${s.blockName})` : 'Unassigned'),
      },
      { key: 'status', label: 'Status' },
      { key: 'emergencyContact', label: 'Emergency Contact' },
      { key: 'emergencyPhone', label: 'Emergency Phone' },
    ]);
  };

  const isColVisible = (key: string) => {
    const col = columns.find(c => c.key === key);
    return col ? col.visible : true;
  };

  const statusBadge = (status: Student['status']) => {
    if (status === 'active') return <Badge variant="active">Active</Badge>;
    if (status === 'fee-due') return <Badge variant="pending">Fee Due</Badge>;
    if (status === 'unassigned') return <Badge variant="vacant">Unassigned</Badge>;
    return <Badge variant="danger">Inactive</Badge>;
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon" />;
    return sortOrder === 'asc' ? (
      <ArrowUp size={12} className="sort-icon" />
    ) : (
      <ArrowDown size={12} className="sort-icon" />
    );
  };

  const { user, role, updateUser } = useAuth();
  const isStudentRole = role === 'student';

  // Find logged-in student record
  const currentStudent: Student = students.find(s =>
    (user?.studentId && s.studentId.toLowerCase() === user.studentId.toLowerCase()) ||
    (user?.id && s.id === user.id) ||
    (user?.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
    (user?.name && `${s.firstName} ${s.lastName}`.toLowerCase() === user.name.toLowerCase())
  ) || {
    id: user?.id || `s_${Date.now()}`,
    studentId: user?.studentId || 'STU-NEW',
    firstName: user?.name ? user.name.split(' ')[0] : 'Student',
    lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : 'Resident',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    course: 'MCA',
    semester: 'Sem 1',
    department: 'Computer Applications',
    roomNumber: 'A-101',
    blockName: 'Block A',
    checkInDate: new Date().toISOString().slice(0, 10),
    emergencyContact: '',
    emergencyPhone: '',
    status: 'active',
    avatar: user?.name ? (user.name[0] || 'S') : 'S',
  };

  // Student Self-Management States
  const [isEditingSelf, setIsEditingSelf] = useState(false);
  const [selfForm, setSelfForm] = useState({
    phone: currentStudent.phone || '',
    email: currentStudent.email || '',
    emergencyContact: currentStudent.emergencyContact || '',
    emergencyPhone: currentStudent.emergencyPhone || '',
  });

  useEffect(() => {
    setSelfForm({
      phone: currentStudent.phone || '',
      email: currentStudent.email || '',
      emergencyContact: currentStudent.emergencyContact || '',
      emergencyPhone: currentStudent.emergencyPhone || '',
    });
  }, [currentStudent.id, currentStudent.phone, currentStudent.email, currentStudent.emergencyContact, currentStudent.emergencyPhone]);

  const [selfSuccessMsg, setSelfSuccessMsg] = useState('');
  const [selfErrorMsg, setSelfErrorMsg] = useState('');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);

  const openSelfEdit = () => {
    setSelfForm({
      phone: currentStudent.phone || '',
      email: currentStudent.email || '',
      emergencyContact: currentStudent.emergencyContact || '',
      emergencyPhone: currentStudent.emergencyPhone || '',
    });
    setSelfErrorMsg('');
    setIsEditingSelf(true);
  };

  const handleSelfUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelfErrorMsg('');

    if (!selfForm.phone.trim() || selfForm.phone.trim().length < 7) {
      setSelfErrorMsg('Please type a valid mobile phone number (at least 7 digits).');
      return;
    }
    if (!selfForm.email.trim() || !selfForm.email.includes('@')) {
      setSelfErrorMsg('Please type a valid email address.');
      return;
    }

    setStudents(prev => {
      const exists = prev.some(s => s.id === currentStudent.id || s.studentId === currentStudent.studentId);
      if (exists) {
        return prev.map(s => {
          if (s.id === currentStudent.id || s.studentId === currentStudent.studentId) {
            return {
              ...s,
              phone: selfForm.phone.trim(),
              email: selfForm.email.trim(),
              emergencyContact: selfForm.emergencyContact.trim(),
              emergencyPhone: selfForm.emergencyPhone.trim(),
            };
          }
          return s;
        });
      } else {
        const updatedRecord: Student = {
          ...currentStudent,
          phone: selfForm.phone.trim(),
          email: selfForm.email.trim(),
          emergencyContact: selfForm.emergencyContact.trim(),
          emergencyPhone: selfForm.emergencyPhone.trim(),
        };
        return [updatedRecord, ...prev];
      }
    });

    if (user) {
      updateUser({
        email: selfForm.email.trim(),
        ...({ phone: selfForm.phone.trim() } as any),
      });
    }

    logAuditAction(
      'students',
      'UPDATE',
      `${currentStudent.firstName} ${currentStudent.lastName} (${currentStudent.studentId})`,
      `${currentStudent.firstName} ${currentStudent.lastName} (Student)`,
      `Resident self-updated personal phone (${selfForm.phone.trim()}) & email (${selfForm.email.trim()})`,
      currentStudent.studentId
    );

    setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setSelfSuccessMsg(
      'Your contact details have been updated successfully! Changes have been saved and are immediately visible to the hostel warden and administration.'
    );
    setIsEditingSelf(false);
  };

  // ============================================================
  // STUDENT VIEW (Permission bounded: only view self, update contact)
  // ============================================================
  if (isStudentRole) {
    return (
      <PageLayout>
        <div className="student-profile-container">
          {/* Header row */}
          <div className="page-header-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 className="page-title" style={{ margin: 0 }}>
                  My Hostel Profile
                </h1>
                <span className="profile-pill highlight">
                  <ShieldCheck size={14} /> Student Access
                </span>
              </div>
              <p className="page-subtitle">
                Personal residency record & verified contact details for {currentStudent.firstName} {currentStudent.lastName}
              </p>
            </div>
            <div className="page-header-actions">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => setShowHistoryModal(true)}
                title="View residency & profile activity history"
              >
                <History size={14} />
                <span>History</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openSelfEdit}
              >
                <Edit2 size={14} />
                <span>Update Contact Details</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {selfSuccessMsg && (
            <div className="student-alert-success">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={18} />
                <span>{selfSuccessMsg}</span>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setSelfSuccessMsg('')}
                style={{ color: 'inherit' }}
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Permission Notice Banner */}
          <div className="student-permission-banner">
                <ShieldCheck size={20} className="student-permission-icon" />
                <div>
                  <div>
                    <strong>Student Permission Boundary:</strong> You are viewing your personal profile in Student mode.
                    Room assignments and official administrative records are strictly managed by the Hostel Warden.
                  </div>
                  <div style={{ marginTop: 4, opacity: 0.9, fontSize: '0.84rem' }}>
                    You have permission to update your personal phone, email, and emergency contact details.
                    Any updates you make are <strong>instantly synchronized and visible to the Admin</strong>.
                  </div>
                </div>
              </div>

              {/* Profile Hero Card */}
              <div className="profile-hero-card">
                <div className="profile-hero-left">
                  <div className="profile-hero-avatar" style={{ overflow: 'hidden' }}>
                    {currentStudent.photo || currentStudent.avatar?.startsWith('data:') ? (
                      <img
                        src={currentStudent.photo || currentStudent.avatar}
                        alt={currentStudent.firstName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      currentStudent.avatar
                    )}
                  </div>
                  <div className="profile-hero-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h2 className="profile-hero-name">
                        {currentStudent.firstName} {currentStudent.lastName}
                      </h2>
                      {statusBadge(currentStudent.status)}
                    </div>
                    <div className="profile-hero-badges">
                      <span className="profile-pill highlight" title="Official Student ID">
                        <GraduationCap size={13} /> {currentStudent.studentId}
                      </span>
                      {currentStudent.rollNumber && (
                        <span className="profile-pill" title="University Roll Number">
                          Roll: {currentStudent.rollNumber}
                        </span>
                      )}
                      <span className="profile-pill" title="Course and Department">
                        {currentStudent.course} — {currentStudent.semester} ({currentStudent.department || 'Computer Applications'})
                      </span>
                      {currentStudent.roomNumber ? (
                        <span className="profile-pill room-pill" title="Allocated Room">
                          <Key size={13} /> Room {currentStudent.roomNumber} ({currentStudent.blockName || 'Hostel'})
                        </span>
                      ) : (
                        <span className="profile-pill" style={{ color: 'var(--clr-warning)' }}>
                          Room Allocation Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    onClick={openSelfEdit}
                  >
                    <Edit2 size={14} /> Edit Contact Info
                  </button>
                </div>
              </div>

              {/* Detail Sections Grid */}
              <div className="profile-sections-grid">
                {/* Card 1: Official Administrative Records (Locked) */}
                <div className="profile-card">
                  <div className="profile-card-header">
                    <h3 className="profile-card-title">
                      <Lock size={17} style={{ color: 'var(--clr-primary)' }} />
                      <span>Official Academic & Hostel Record</span>
                    </h3>
                    <span className="field-tag locked">
                      <Lock size={11} /> Admin Controlled
                    </span>
                  </div>

                  <div className="profile-card-body">
                    <div className="profile-fields-grid">
                      <div className="profile-field-box">
                        <div className="profile-field-top">
                          <span className="profile-field-label">Student ID</span>
                          <span className="field-tag locked"><Lock size={10} /> Locked</span>
                        </div>
                        <span className="profile-field-val" style={{ fontFamily: 'monospace' }}>
                          {currentStudent.studentId}
                        </span>
                      </div>

                      <div className="profile-field-box">
                        <div className="profile-field-top">
                          <span className="profile-field-label">Roll Number</span>
                          <span className="field-tag locked"><Lock size={10} /> Locked</span>
                        </div>
                        <span className="profile-field-val">
                          {currentStudent.rollNumber || 'Not assigned'}
                        </span>
                      </div>

                      <div className="profile-field-box">
                        <div className="profile-field-top">
                          <span className="profile-field-label">Course & Semester</span>
                          <span className="field-tag locked"><Lock size={10} /> Locked</span>
                        </div>
                        <span className="profile-field-val">
                          {currentStudent.course} — {currentStudent.semester}
                        </span>
                      </div>

                      <div className="profile-field-box">
                        <div className="profile-field-top">
                          <span className="profile-field-label">Department</span>
                          <span className="field-tag locked"><Lock size={10} /> Locked</span>
                        </div>
                        <span className="profile-field-val">
                          {currentStudent.department || 'Computer Applications'}
                        </span>
                      </div>

                      <div className="profile-field-box">
                        <div className="profile-field-top">
                          <span className="profile-field-label">Allocated Room</span>
                          <span className="field-tag locked"><Lock size={10} /> Locked</span>
                        </div>
                        <span className="profile-field-val">
                          {currentStudent.roomNumber ? (
                            <>
                              <strong>{currentStudent.roomNumber}</strong>{' '}
                              <span style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>
                                ({currentStudent.blockName || 'Hostel'})
                              </span>
                            </>
                          ) : (
                            <span className="muted">No room assigned yet</span>
                          )}
                        </span>
                      </div>

                      <div className="profile-field-box">
                        <div className="profile-field-top">
                          <span className="profile-field-label">Check-in Date</span>
                          <span className="field-tag locked"><Lock size={10} /> Locked</span>
                        </div>
                        <span className="profile-field-val">
                          {currentStudent.checkInDate || '01 Aug 2024'}
                        </span>
                      </div>

                      <div className="profile-field-box" style={{ gridColumn: 'span 2' }}>
                        <div className="profile-field-top">
                          <span className="profile-field-label">Residency Status</span>
                          <span className="field-tag locked"><Lock size={10} /> Locked</span>
                        </div>
                        <div style={{ marginTop: 2 }}>{statusBadge(currentStudent.status)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="profile-card-footer-notice">
                    <Lock size={14} />
                    <span>
                      Official records are verified and maintained by the Hostel Warden. To request room reallocation or enrollment changes, please visit the Warden's office.
                    </span>
                  </div>
                </div>

                {/* Card 2: Contact & Emergency Information (Student Editable) */}
                <div className="profile-card">
                  <div className="profile-card-header">
                    <h3 className="profile-card-title">
                      <Phone size={17} style={{ color: 'var(--clr-primary)' }} />
                      <span>Personal & Emergency Contacts</span>
                    </h3>
                    <button
                      type="button"
                      className="btn btn-outline-dark btn-sm"
                      onClick={openSelfEdit}
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    >
                      <Edit2 size={12} /> Edit Information
                    </button>
                  </div>

                  <div className="profile-card-body">
                    <div className="profile-fields-grid">
                      <div className="profile-field-box editable-field">
                        <div className="profile-field-top">
                          <span className="profile-field-label">Mobile Phone</span>
                          <span className="field-tag editable"><Edit2 size={10} /> Editable</span>
                        </div>
                        <span className="profile-field-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Phone size={14} style={{ color: 'var(--clr-primary)' }} />
                          {currentStudent.phone || <span className="muted">Not provided</span>}
                        </span>
                      </div>

                      <div className="profile-field-box editable-field">
                        <div className="profile-field-top">
                          <span className="profile-field-label">Email Address</span>
                          <span className="field-tag editable"><Edit2 size={10} /> Editable</span>
                        </div>
                        <span className="profile-field-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Mail size={14} style={{ color: 'var(--clr-primary)' }} />
                          {currentStudent.email || <span className="muted">Not provided</span>}
                        </span>
                      </div>

                      <div className="profile-field-box editable-field">
                        <div className="profile-field-top">
                          <span className="profile-field-label">Emergency Contact Name</span>
                          <span className="field-tag editable"><Edit2 size={10} /> Editable</span>
                        </div>
                        <span className="profile-field-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <UserCheck size={14} style={{ color: 'var(--clr-primary)' }} />
                          {currentStudent.emergencyContact || <span className="muted">Not specified</span>}
                        </span>
                      </div>

                      <div className="profile-field-box editable-field">
                        <div className="profile-field-top">
                          <span className="profile-field-label">Emergency Phone</span>
                          <span className="field-tag editable"><Edit2 size={10} /> Editable</span>
                        </div>
                        <span className="profile-field-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <PhoneCall size={14} style={{ color: 'var(--clr-primary)' }} />
                          {currentStudent.emergencyPhone || <span className="muted">Not specified</span>}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'var(--clr-surface-2)',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--clr-border)',
                        fontSize: '0.82rem',
                        color: 'var(--clr-text-secondary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--clr-text)' }}>
                        <Clock size={14} style={{ color: 'var(--clr-primary)' }} />
                        <span>Real-time Administrator Visibility:</span>
                      </div>
                      <div>
                        Whenever you update your phone or emergency contact details, the changes are stored immediately and visible to the hostel warden and staff in their administrative directory.
                      </div>
                      {lastUpdatedTime && (
                        <div style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--clr-success)', fontWeight: 600 }}>
                          ✓ Last updated at {lastUpdatedTime}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="profile-card-footer-notice">
                    <CheckCircle size={14} style={{ color: 'var(--clr-success)' }} />
                    <span>
                      Keep your emergency contact details updated for campus safety notifications.
                    </span>
                  </div>
                </div>
              </div>

          {/* UPDATE CONTACT DETAILS MODAL */}
          {isEditingSelf && (
            <Modal
              isOpen={isEditingSelf}
              onClose={() => setIsEditingSelf(false)}
              title="Update My Contact Information"
              maxWidth="540px"
            >
              <form onSubmit={handleSelfUpdateSubmit}>
                {selfErrorMsg && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: 'var(--clr-danger)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.84rem',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{selfErrorMsg}</span>
                  </div>
                )}

                {/* Locked Official Identity Summary */}
                <div
                  style={{
                    background: 'var(--clr-surface-2)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--clr-border)',
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Official Resident ID
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {currentStudent.firstName} {currentStudent.lastName} ({currentStudent.studentId})
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Allotted Room
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {currentStudent.roomNumber ? `Room ${currentStudent.roomNumber}` : 'Unassigned'}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Mobile Phone Number *</label>
                  <input
                    className="form-input"
                    type="tel"
                    value={selfForm.phone}
                    onChange={e => setSelfForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Type your mobile phone number (e.g. 9876543210)"
                    required
                  />
                  <small style={{ color: 'var(--clr-text-muted)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                    Type your active mobile phone number for hostel communication.
                  </small>
                </div>

                <div className="form-group" style={{ marginTop: 14 }}>
                  <label>Email Address *</label>
                  <input
                    className="form-input"
                    type="email"
                    value={selfForm.email}
                    onChange={e => setSelfForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Type your email address (e.g. yourname@gmail.com)"
                    required
                  />
                  <small style={{ color: 'var(--clr-text-muted)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                    Notifications and fee receipts will be dispatched here.
                  </small>
                </div>

                <div className="form-row" style={{ marginTop: 14 }}>
                  <div className="form-group">
                    <label>Emergency Contact Person</label>
                    <input
                      className="form-input"
                      type="text"
                      value={selfForm.emergencyContact}
                      onChange={e => setSelfForm(f => ({ ...f, emergencyContact: e.target.value }))}
                      placeholder="Type parent or guardian name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact Phone</label>
                    <input
                      className="form-input"
                      type="tel"
                      value={selfForm.emergencyPhone}
                      onChange={e => setSelfForm(f => ({ ...f, emergencyPhone: e.target.value }))}
                      placeholder="Type emergency phone number (e.g. 9876500001)"
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--clr-bg)',
                    border: '1px solid var(--clr-border)',
                    fontSize: '0.78rem',
                    color: 'var(--clr-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Lock size={13} />
                  <span>
                    Note: Academic courses, roll number, and room allocations cannot be edited here. Contact the warden for room changes.
                  </span>
                </div>

                <div className="modal-footer" style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={() => setIsEditingSelf(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes & Sync with Admin ✓
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* Student Profile Action History Modal */}
          <HistoryModal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            moduleName="students"
            title="My Residency & Profile Activity History"
          />
        </div>
      </PageLayout>
    );
  }

  // ============================================================
  // ADMIN VIEW (Full student management directory & operations)
  // ============================================================
  return (
    <PageLayout>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Student Management</h1>
          <p className="page-subtitle">
            Directory & live record control — {students.length} total resident students
          </p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={handleExport}
            title="Export filtered records to CSV"
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
            onClick={() => {
              setForm(initialForm);
              setShowAdd(true);
            }}
          >
            <Plus size={15} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KpiCard
          label="Total Students"
          value={students.length}
          change={`Showing ${sorted.length}`}
          changeType="neutral"
          accent="green"
          icon={<Users size={24} />}
        />
        <KpiCard
          label="Active Residents"
          value={students.filter(s => s.status === 'active').length}
          change={`${((students.filter(s => s.status === 'active').length / (students.length || 1)) * 100).toFixed(0)}%`}
          changeType="up"
          accent="accent"
          icon={<CheckCircle size={24} />}
          delay={0.1}
        />
        <KpiCard
          label="Fee Due"
          value={students.filter(s => s.status === 'fee-due').length}
          change="Pending payment"
          changeType="down"
          accent="warning"
          icon={<Key size={24} />}
          delay={0.2}
        />
        <KpiCard
          label="Unassigned"
          value={students.filter(s => s.status === 'unassigned').length}
          change="Needs room"
          changeType="down"
          accent="danger"
          icon={<Key size={24} />}
          delay={0.3}
        />
      </div>

      <div className="data-table-card">
        {/* Table Header Controls */}
        <div className="data-table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h3>Student Directory</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
              ({sorted.length} {sorted.length === 1 ? 'record' : 'records'})
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
              <option value="active">Active</option>
              <option value="fee-due">Fee Due</option>
              <option value="unassigned">Unassigned</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              className="search-input"
              style={{ width: 130 }}
              value={courseFilter}
              onChange={e => {
                setCourseFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Courses</option>
              <option value="MCA">MCA</option>
              <option value="BCA">BCA</option>
              <option value="B.Sc CS">B.Sc CS</option>
              <option value="M.Sc CS">M.Sc CS</option>
            </select>

            <input
              className="search-input"
              placeholder="Search by name, ID, room, phone…"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />

            <ColumnVisibilityDropdown columns={columns} onChange={setColumns} />
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div style={{ padding: '0 20px', paddingTop: 14 }}>
            <BulkActionBar
              selectedCount={selectedIds.length}
              totalCount={sorted.length}
              onClear={() => setSelectedIds([])}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)', fontWeight: 600 }}>
                  Set Status:
                </span>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => handleBulkStatusChange('active')}
                >
                  Active
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => handleBulkStatusChange('fee-due')}
                >
                  Fee Due
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => handleBulkStatusChange('unassigned')}
                >
                  Unassigned
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
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
                      title="Select / Deselect all"
                    />
                  </th>
                )}
                {isColVisible('student') && (
                  <th className="sortable" onClick={() => handleSort('name')}>
                    <div className={`th-sort-wrapper ${sortField === 'name' ? 'active' : ''}`}>
                      <span>Student</span>
                      {renderSortIndicator('name')}
                    </div>
                  </th>
                )}
                {isColVisible('studentId') && (
                  <th className="sortable" onClick={() => handleSort('studentId')}>
                    <div className={`th-sort-wrapper ${sortField === 'studentId' ? 'active' : ''}`}>
                      <span>Student ID</span>
                      {renderSortIndicator('studentId')}
                    </div>
                  </th>
                )}
                {isColVisible('course') && (
                  <th className="sortable" onClick={() => handleSort('course')}>
                    <div className={`th-sort-wrapper ${sortField === 'course' ? 'active' : ''}`}>
                      <span>Course</span>
                      {renderSortIndicator('course')}
                    </div>
                  </th>
                )}
                {isColVisible('department') && <th>Department</th>}
                {isColVisible('rollNumber') && <th>Roll No</th>}
                {isColVisible('room') && (
                  <th className="sortable" onClick={() => handleSort('room')}>
                    <div className={`th-sort-wrapper ${sortField === 'room' ? 'active' : ''}`}>
                      <span>Room</span>
                      {renderSortIndicator('room')}
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
                {isColVisible('emergency') && <th>Emergency</th>}
                {isColVisible('status') && (
                  <th className="sortable" onClick={() => handleSort('status')}>
                    <div className={`th-sort-wrapper ${sortField === 'status' ? 'active' : ''}`}>
                      <span>Status</span>
                      {renderSortIndicator('status')}
                    </div>
                  </th>
                )}
                {isColVisible('password') && <th>Password</th>}
                {isColVisible('actions') && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map(st => {
                const isSelected = selectedIds.includes(st.id);
                return (
                  <tr key={st.id} className={isSelected ? 'row-selected' : ''}>
                    {isColVisible('select') && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(st.id)}
                        />
                      </td>
                    )}
                    {isColVisible('student') && (
                      <td>
                        <div className="avatar-row" style={{ alignItems: 'center' }}>
                          <div
                            style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}
                            title="Click camera icon to upload student face photo"
                          >
                            {st.photo || st.avatar?.startsWith('data:') ? (
                              <div className="avatar" style={{ padding: 0, overflow: 'hidden' }}>
                                <img
                                  src={st.photo || st.avatar}
                                  alt={st.firstName}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                            ) : (
                              <div
                                className={`avatar ${
                                  st.id === 's2' || st.id === 's4' || st.id === 's6' || st.id === 's8'
                                    ? 'avatar-alt'
                                    : ''
                                }`}
                              >
                                {st.avatar}
                              </div>
                            )}

                            {/* Direct face upload overlay on the avatar in the table */}
                            <label
                              htmlFor={`face-upload-${st.id}`}
                              style={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                background: 'var(--clr-primary)',
                                color: '#fff',
                                borderRadius: '50%',
                                width: 18,
                                height: 18,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                border: '1.5px solid var(--clr-surface)',
                                transition: 'transform 0.15s ease',
                              }}
                              title="Upload student face photo"
                              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                              <Camera size={10} />
                              <input
                                id={`face-upload-${st.id}`}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleDirectPhotoUpload(st.id, file);
                                  }
                                }}
                              />
                            </label>
                          </div>

                          <div className="avatar-info">
                            <span className="avatar-name">
                              {st.firstName} {st.lastName}
                            </span>
                            <span className="avatar-sub">{st.email}</span>
                          </div>
                        </div>
                      </td>
                    )}
                    {isColVisible('studentId') && (
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{st.studentId}</td>
                    )}
                    {isColVisible('course') && (
                      <td>
                        {st.course} — <span style={{ color: 'var(--clr-text-muted)' }}>{st.semester}</span>
                      </td>
                    )}
                    {isColVisible('department') && <td>{st.department || '—'}</td>}
                    {isColVisible('rollNumber') && <td>{st.rollNumber || '—'}</td>}
                    {isColVisible('room') && (
                      <td>
                        {st.roomNumber ? (
                          <span style={{ fontWeight: 600 }}>
                            {st.roomNumber}
                            <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem', marginLeft: 4 }}>
                              ({st.blockName || 'Hostel'})
                            </span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--clr-text-muted)' }}>Not Assigned</span>
                        )}
                      </td>
                    )}
                    {isColVisible('phone') && <td>{st.phone}</td>}
                    {isColVisible('emergency') && (
                      <td>
                        <div style={{ fontSize: '0.82rem' }}>{st.emergencyContact || '—'}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)' }}>
                          {st.emergencyPhone || ''}
                        </div>
                      </td>
                    )}
                    {isColVisible('status') && (
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <select
                            className="table-quick-select"
                            value={st.status}
                            onChange={e =>
                              handleQuickStatusChange(st.id, e.target.value as Student['status'])
                            }
                            title="Click to quickly change status"
                          >
                            <option value="active">Active</option>
                            <option value="fee-due">Fee Due</option>
                            <option value="unassigned">Unassigned</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </td>
                    )}
                    {isColVisible('password') && (
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                            ••••••••
                          </span>
                          <button
                            type="button"
                            className="btn-icon"
                            title="View / Reset Password"
                            onClick={() => openPasswordModal(st)}
                            style={{ color: '#d97706', padding: '2px 4px' }}
                          >
                            <Key size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                    {isColVisible('actions') && (
                      <td>
                        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-icon"
                            title="View / Reset Password"
                            onClick={() => openPasswordModal(st)}
                            style={{ color: '#d97706' }}
                          >
                            <Key size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title="View student profile"
                            onClick={() => setViewStudent(st)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Edit student data"
                            onClick={() => openEdit(st)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-danger-icon"
                            title="Delete student"
                            onClick={() => setStudentToDelete(st)}
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
                    style={{ textAlign: 'center', padding: '36px', color: 'var(--clr-text-muted)' }}
                  >
                    No students match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <TablePagination
          currentPage={currentPage}
          totalItems={sorted.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ADD STUDENT MODAL */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Register New Student" maxWidth="640px">
        <form onSubmit={handleAddSubmit}>
          {/* Student Face Photo Uploader */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '14px 16px', background: 'var(--clr-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
            <div style={{ position: 'relative', width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: 'var(--clr-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid var(--clr-primary)' }}>
              {form.photo ? (
                <img src={form.photo} alt="Student Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--clr-primary)' }}>
                  {((form.firstName[0] || 'S') + (form.lastName[0] || 'T')).toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 }}>Student Face Photo</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--clr-text-muted)', marginBottom: 8 }}>
                Upload portrait face photo for student table & ID verification
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label className="btn btn-outline-dark btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: '0.78rem' }}>
                  <Camera size={13} />
                  <span>{form.photo ? 'Change Face Photo' : 'Upload Face Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Photo size exceeds 5MB limit.');
                          return;
                        }
                        const r = new FileReader();
                        r.onload = () => setForm(f => ({ ...f, photo: r.result as string }));
                        r.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {form.photo && (
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    style={{ color: 'var(--clr-danger)', borderColor: 'var(--clr-danger)', padding: '4px 8px', fontSize: '0.78rem' }}
                    onClick={() => setForm(f => ({ ...f, photo: '' }))}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                className="form-input"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                placeholder="e.g. Rahul"
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                className="form-input"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                placeholder="e.g. Verma"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="student@hms.edu"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone *</label>
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
              <label>Course *</label>
              <select
                className="form-select"
                value={form.course}
                onChange={e => setForm(f => ({ ...f, course: e.target.value }))}
                required
              >
                <option value="MCA">MCA</option>
                <option value="BCA">BCA</option>
                <option value="B.Sc CS">B.Sc CS</option>
                <option value="M.Sc CS">M.Sc CS</option>
              </select>
            </div>
            <div className="form-group">
              <label>Semester *</label>
              <select
                className="form-select"
                value={form.semester}
                onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                required
              >
                {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'].map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <input
                className="form-input"
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder="Department"
              />
            </div>
            <div className="form-group">
              <label>Roll Number</label>
              <input
                className="form-input"
                value={form.rollNumber}
                onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))}
                placeholder="e.g. 24MCA051"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Room Number (Optional)</label>
              <input
                className="form-input"
                value={form.roomNumber}
                onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
                placeholder="e.g. A-101"
              />
            </div>
            <div className="form-group">
              <label>Block</label>
              <select
                className="form-select"
                value={form.blockName}
                onChange={e => setForm(f => ({ ...f, blockName: e.target.value }))}
              >
                <option value="Block A">Block A (Boys)</option>
                <option value="Block B">Block B (Boys)</option>
                <option value="Block C">Block C (Girls)</option>
                <option value="Block D">Block D (Girls)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Initial Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as Student['status'] }))}
              >
                <option value="unassigned">Unassigned</option>
                <option value="active">Active</option>
                <option value="fee-due">Fee Due</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Emergency Contact</label>
              <input
                className="form-input"
                value={form.emergencyContact}
                onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))}
                placeholder="Guardian Name"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Emergency Phone</label>
            <input
              className="form-input"
              value={form.emergencyPhone}
              onChange={e => setForm(f => ({ ...f, emergencyPhone: e.target.value }))}
              placeholder="Guardian Phone"
            />
          </div>

          <div className="form-group">
            <label>Account Password</label>
            <input
              className="form-input"
              type="text"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Initial student account password (default: stu123)"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
              Default is stu123. The student can sign in with their Student ID or Email and this password.
            </span>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-dark" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Student ✓
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <Modal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          title={`Edit Student — ${editingStudent.studentId}`}
          maxWidth="640px"
        >
          <form onSubmit={handleEditSubmit}>
            {/* Student Face Photo Uploader */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '14px 16px', background: 'var(--clr-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
              <div style={{ position: 'relative', width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: 'var(--clr-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid var(--clr-primary)' }}>
                {form.photo ? (
                  <img src={form.photo} alt="Student Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--clr-primary)' }}>
                    {((form.firstName[0] || 'S') + (form.lastName[0] || 'T')).toUpperCase()}
                  </span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 }}>Student Face Photo</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--clr-text-muted)', marginBottom: 8 }}>
                  Update portrait face photo for student table & ID verification
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label className="btn btn-outline-dark btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: '0.78rem' }}>
                    <Camera size={13} />
                    <span>{form.photo ? 'Change Face Photo' : 'Upload Face Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Photo size exceeds 5MB limit.');
                            return;
                          }
                          const r = new FileReader();
                          r.onload = () => setForm(f => ({ ...f, photo: r.result as string }));
                          r.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {form.photo && (
                    <button
                      type="button"
                      className="btn btn-outline-dark btn-sm"
                      style={{ color: 'var(--clr-danger)', borderColor: 'var(--clr-danger)', padding: '4px 8px', fontSize: '0.78rem' }}
                      onClick={() => setForm(f => ({ ...f, photo: '' }))}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  className="form-input"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  className="form-input"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  className="form-input"
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Course *</label>
                <select
                  className="form-select"
                  value={form.course}
                  onChange={e => setForm(f => ({ ...f, course: e.target.value }))}
                  required
                >
                  <option value="MCA">MCA</option>
                  <option value="BCA">BCA</option>
                  <option value="B.Sc CS">B.Sc CS</option>
                  <option value="M.Sc CS">M.Sc CS</option>
                </select>
              </div>
              <div className="form-group">
                <label>Semester *</label>
                <select
                  className="form-select"
                  value={form.semester}
                  onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                  required
                >
                  {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'].map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <input
                  className="form-input"
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Roll Number</label>
                <input
                  className="form-input"
                  value={form.rollNumber}
                  onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Room Number</label>
                <input
                  className="form-input"
                  value={form.roomNumber}
                  onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
                  placeholder="e.g. A-101"
                />
              </div>
              <div className="form-group">
                <label>Block</label>
                <select
                  className="form-select"
                  value={form.blockName}
                  onChange={e => setForm(f => ({ ...f, blockName: e.target.value }))}
                >
                  <option value="Block A">Block A (Boys)</option>
                  <option value="Block B">Block B (Boys)</option>
                  <option value="Block C">Block C (Girls)</option>
                  <option value="Block D">Block D (Girls)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as Student['status'] }))}
                >
                  <option value="active">Active</option>
                  <option value="fee-due">Fee Due</option>
                  <option value="unassigned">Unassigned</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label>Emergency Contact</label>
                <input
                  className="form-input"
                  value={form.emergencyContact}
                  onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Emergency Phone</label>
              <input
                className="form-input"
                value={form.emergencyPhone}
                onChange={e => setForm(f => ({ ...f, emergencyPhone: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Account Password</label>
              <input
                className="form-input"
                type="text"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Student account password"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                Changing this password directly updates the student's login credentials.
              </span>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={() => setEditingStudent(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes ✓
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW STUDENT PROFILE MODAL */}
      {viewStudent && (
        <Modal
          isOpen={!!viewStudent}
          onClose={() => setViewStudent(null)}
          title="Student Profile"
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                background: 'var(--clr-bg)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {viewStudent.photo || viewStudent.avatar?.startsWith('data:') ? (
                  <div className="avatar" style={{ width: 56, height: 56, padding: 0, overflow: 'hidden' }}>
                    <img
                      src={viewStudent.photo || viewStudent.avatar}
                      alt={viewStudent.firstName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div
                    className={`avatar ${
                      viewStudent.id === 's2' ||
                      viewStudent.id === 's4' ||
                      viewStudent.id === 's6' ||
                      viewStudent.id === 's8'
                        ? 'avatar-alt'
                        : ''
                    }`}
                    style={{ width: 56, height: 56, fontSize: '1.2rem' }}
                  >
                    {viewStudent.avatar}
                  </div>
                )}
                <label
                  htmlFor={`view-face-upload-${viewStudent.id}`}
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    background: 'var(--clr-primary)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    border: '1.5px solid var(--clr-surface)',
                  }}
                  title="Upload / Change face photo"
                >
                  <Camera size={11} />
                  <input
                    id={`view-face-upload-${viewStudent.id}`}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleDirectPhotoUpload(viewStudent.id, file);
                        const r = new FileReader();
                        r.onload = () => {
                          setViewStudent(prev => (prev ? { ...prev, photo: r.result as string } : null));
                        };
                        r.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {viewStudent.firstName} {viewStudent.lastName}
                </div>
                <div style={{ fontSize: '.84rem', color: 'var(--clr-text-muted)' }}>
                  {viewStudent.studentId} · {viewStudent.course} {viewStudent.semester}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>{statusBadge(viewStudent.status)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Roll Number', value: viewStudent.rollNumber || 'N/A' },
                { label: 'Department', value: viewStudent.department || 'N/A' },
                {
                  label: 'Room Allocation',
                  value: viewStudent.roomNumber
                    ? `${viewStudent.roomNumber}, ${viewStudent.blockName || ''}`
                    : 'Not assigned',
                },
                { label: 'Check-in Date', value: viewStudent.checkInDate ?? 'N/A' },
                { label: 'Phone', value: viewStudent.phone },
                { label: 'Email', value: viewStudent.email },
                { label: 'Emergency Contact', value: viewStudent.emergencyContact || 'N/A' },
                { label: 'Emergency Phone', value: viewStudent.emergencyPhone || 'N/A' },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    padding: 14,
                    background: 'var(--clr-bg)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '.72rem',
                      color: 'var(--clr-text-muted)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Student Account Password Card */}
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(217, 119, 6, 0.08)',
                border: '1px solid rgba(217, 119, 6, 0.25)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: '.72rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                  Student Account Login Password
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', letterSpacing: showCurrentPassword ? 'normal' : '2px' }}>
                    {showCurrentPassword ? getStudentPassword(viewStudent) : '••••••••'}
                  </span>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    title={showCurrentPassword ? 'Hide password' : 'View password'}
                  >
                    {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleCopyPassword(getStudentPassword(viewStudent))}
                    title="Copy password"
                  >
                    <Copy size={14} />
                  </button>
                  {copiedNotification && (
                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Copied!</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                style={{ borderColor: '#d97706', color: '#b45309' }}
                onClick={() => {
                  const target = viewStudent;
                  setViewStudent(null);
                  openPasswordModal(target);
                }}
              >
                <Key size={13} />
                <span>Reset Password</span>
              </button>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => {
                  const target = viewStudent;
                  setViewStudent(null);
                  openEdit(target);
                }}
              >
                <Edit2 size={13} />
                <span>Edit Profile</span>
              </button>
              <Link to="/fees" className="btn btn-outline-dark btn-sm">
                View Fees
              </Link>
              <Link to="/complaints" className="btn btn-outline-dark btn-sm">
                Complaints
              </Link>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setViewStudent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* VIEW & RESET STUDENT PASSWORD MODAL */}
      {passwordStudent && (
        <Modal
          isOpen={!!passwordStudent}
          onClose={() => setPasswordStudent(null)}
          title={`Student Credentials & Password: ${passwordStudent.firstName} ${passwordStudent.lastName}`}
          maxWidth="500px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {passwordSuccess && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#d1fae5',
                  color: '#065f46',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                }}
              >
                {passwordError}
              </div>
            )}

            {/* Current Account Details */}
            <div
              style={{
                padding: '14px 16px',
                background: 'var(--clr-bg)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>Student ID (Login ID):</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{passwordStudent.studentId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>Login Email:</span>
                <span style={{ fontWeight: 600 }}>{passwordStudent.email}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 8,
                  borderTop: '1px dashed var(--clr-border)',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', fontWeight: 600 }}>Current Password:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      letterSpacing: showCurrentPassword ? 'normal' : '2px',
                      background: 'var(--clr-surface)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--clr-border)',
                    }}
                  >
                    {showCurrentPassword ? getStudentPassword(passwordStudent) : '••••••••'}
                  </span>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    title={showCurrentPassword ? 'Hide current password' : 'View current password'}
                  >
                    {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleCopyPassword(getStudentPassword(passwordStudent))}
                    title="Copy current password"
                  >
                    <Copy size={14} />
                  </button>
                  {copiedNotification && (
                    <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>Copied!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Reset Password Form */}
            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--clr-text-main)' }}>
                Set New Student Password
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: 4, display: 'block' }}>
                  New Password
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Enter new password (min. 4 chars)"
                      value={newPasswordInput}
                      onChange={e => {
                        setNewPasswordInput(e.target.value);
                        setPasswordError('');
                      }}
                      style={{ paddingRight: 36, width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--clr-text-muted)',
                        padding: 2,
                      }}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    onClick={handleGeneratePassword}
                    title="Generate secure random password"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <RefreshCw size={13} />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {/* Quick default reset option */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-xs"
                  onClick={() => setNewPasswordInput('stu123')}
                  style={{ fontSize: '0.78rem' }}
                >
                  Use Default "stu123"
                </button>
              </div>

              <div className="modal-footer" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => setPasswordStudent(null)}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!newPasswordInput.trim()}
                >
                  <Key size={13} />
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* SINGLE DELETE CONFIRM MODAL */}
      {studentToDelete && (
        <ConfirmModal
          isOpen={!!studentToDelete}
          onClose={() => setStudentToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Student"
          message={`Are you sure you want to permanently delete resident student "${studentToDelete.firstName} ${studentToDelete.lastName}" (${studentToDelete.studentId})? This action cannot be undone.`}
          confirmText="Yes, Delete Student"
          danger
        />
      )}

      {/* BULK DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Selected Students"
        message={`Are you sure you want to permanently delete all ${selectedIds.length} selected students? All associated records will be removed.`}
        confirmText={`Delete ${selectedIds.length} Students`}
        danger
      />

      {/* ADMIN TABLE ACTION HISTORY MODAL */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        moduleName="students"
        title="Students Table Action & Audit History"
      />
    </PageLayout>
  );
};

export default Students;
