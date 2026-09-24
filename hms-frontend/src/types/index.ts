// ============================================================
// HMS – Hostel Management System
// TypeScript Type Definitions
// ============================================================

export type UserRole = 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
}

export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department?: string;
  rollNumber?: string;
  course: string;
  semester: string;
  roomId?: string;
  roomNumber?: string;
  blockName?: string;
  checkInDate?: string;
  emergencyContact: string;
  emergencyPhone: string;
  status: 'active' | 'inactive' | 'fee-due' | 'unassigned';
  avatar: string; // initials
}

export type RoomStatus = 'available' | 'full' | 'maintenance';

export interface Room {
  id: string;
  roomNumber: string;
  block: 'A' | 'B' | 'C' | 'D';
  blockLabel: string;
  floor: number;
  totalBeds: number;
  occupiedBeds: number;
  roomType: 'Single' | 'Double' | 'Triple' | 'Dormitory';
  status: RoomStatus;
  gender: 'Boys' | 'Girls';
}

export interface Allocation {
  id: string;
  allocationId: string;
  studentId: string;
  studentName: string;
  roomId: string;
  roomNumber: string;
  block: string;
  checkInDate: string;
  checkOutDate?: string;
  status: 'active' | 'completed' | 'pending';
}

export type FeeStatus = 'paid' | 'pending' | 'overdue';
export type FeeCategory = 'Hostel Sem Fee' | 'Mess Fee' | 'Security Deposit' | 'Electricity' | 'Other';

export interface FeeInvoice {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  category: FeeCategory;
  amount: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  paidAmount?: number;
  paymentMode?: string;
  transactionRef?: string;
  status: FeeStatus;
}

export type ComplaintCategory = 'Electrical' | 'Plumbing' | 'Wi-Fi' | 'Hygiene' | 'Furniture' | 'Other';
export type ComplaintPriority = 'Low' | 'Medium' | 'High';
export type ComplaintStatus = 'open' | 'in-progress' | 'resolved';

export interface Complaint {
  id: string;
  ticketId: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  category: ComplaintCategory;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  raisedDate: string;
  resolvedDate?: string;
  remarks?: string;
}

export type VisitorStatus = 'inside' | 'checked-out';
export type VisitPurpose = 'Family Visit' | 'Academic' | 'Personal' | 'Official' | 'Other';

export interface Visitor {
  id: string;
  visitorName: string;
  phone: string;
  hostStudentId: string;
  hostStudentName: string;
  roomNumber: string;
  purpose: VisitPurpose;
  idProof: string;
  checkInTime: string;
  checkOutTime?: string;
  date: string;
  status: VisitorStatus;
}

export type NoticePriority = 'urgent' | 'important' | 'general';

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: NoticePriority;
  publishedBy: string;
  publishedDate: string;
  expiryDate: string;
  target: string;
  pinned: boolean;
}

export interface DashboardStats {
  totalStudents: number;
  occupancyPercent: number;
  feeDefaulters: number;
  openComplaints: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  totalFeeCollected: number;
}

export interface BlockOccupancy {
  block: string;
  label: string;
  occupied: number;
  vacant: number;
  total: number;
  percent: number;
}

// Generic form result
export type ActionResult = { success: boolean; message: string };

// Table Action & Audit History
export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'BULK_DELETE'
  | 'STATUS_CHANGE'
  | 'ALLOCATE'
  | 'DEALLOCATE'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'PAYMENT'
  | 'REQUEST'
  | 'RESET';

export type AuditModule = 'students' | 'rooms' | 'fees' | 'complaints' | 'visitors';

export interface AuditRecord {
  id: string;
  module: AuditModule;
  action: AuditActionType;
  entityName: string;
  performedBy: string;
  details: string;
  timestamp: string;
}
