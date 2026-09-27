import type { AuditActionType, AuditModule, AuditRecord } from '../types';
import { getStoredData, setStoredData } from './storage';

function getStorageKey(module: AuditModule): string {
  return `hms_history_${module}`;
}

export function formatCurrentTimestamp(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr}, ${timeStr}`;
}

export const DEFAULT_AUDIT_LOGS: Record<AuditModule, AuditRecord[]> = {
  students: [
    {
      id: 'aud-stu-001',
      module: 'students',
      action: 'CREATE',
      entityName: 'Amit Rathore (STU-2024-001)',
      performedBy: 'Warden Kamath',
      details: 'Registered new student profile. Assigned to Block A, Room A-101 (Bed 1). Contact verified.',
      timestamp: '22 Sep 2026, 09:30 AM',
      studentId: 'STU-2024-001',
      userId: 's1',
    },
    {
      id: 'aud-stu-002',
      module: 'students',
      action: 'UPDATE',
      entityName: 'Sneha Mehta (STU-2024-004)',
      performedBy: 'Sneha Mehta',
      details: 'Updated emergency guardian contact number and medical dietary preferences.',
      timestamp: '21 Sep 2026, 03:15 PM',
      studentId: 'STU-2024-004',
      userId: 's4',
    },
    {
      id: 'aud-stu-003',
      module: 'students',
      action: 'STATUS_CHANGE',
      entityName: 'Vikram Gupta (STU-2024-005)',
      performedBy: 'Warden Kamath',
      details: 'Verified residency enrollment and activated portal access credentials.',
      timestamp: '20 Sep 2026, 11:45 AM',
      studentId: 'STU-2024-005',
      userId: 's5',
    },
    {
      id: 'aud-stu-004',
      module: 'students',
      action: 'UPDATE',
      entityName: 'Priya Kumar (STU-2024-002)',
      performedBy: 'Warden Kamath',
      details: 'Updated parent phone number and verified local guardian address.',
      timestamp: '19 Sep 2026, 02:20 PM',
      studentId: 'STU-2024-002',
      userId: 's2',
    },
  ],
  rooms: [
    {
      id: 'aud-room-001',
      module: 'rooms',
      action: 'ALLOCATE',
      entityName: 'Bed A-101-1 → Amit Rathore',
      performedBy: 'Warden Kamath',
      details: 'Allocated Bed 1 in Room A-101 (Double AC) to resident Amit Rathore (STU-2024-001). Key #K-101 issued.',
      timestamp: '22 Sep 2026, 10:00 AM',
      studentId: 'STU-2024-001',
      userId: 's1',
    },
    {
      id: 'aud-room-002',
      module: 'rooms',
      action: 'STATUS_CHANGE',
      entityName: 'Room D-112',
      performedBy: 'Warden Kamath',
      details: 'Updated room status to "Maintenance" for urgent bathroom plumbing inspection.',
      timestamp: '21 Sep 2026, 04:30 PM',
      studentId: 'STU-2024-004',
      userId: 's4',
    },
    {
      id: 'aud-room-003',
      module: 'rooms',
      action: 'REQUEST',
      entityName: 'Room Swap Request: Room C-205',
      performedBy: 'Priya Kumar',
      details: 'Submitted room change request from C-205 to C-208 citing study group proximity.',
      timestamp: '20 Sep 2026, 01:10 PM',
      studentId: 'STU-2024-002',
      userId: 's2',
    },
    {
      id: 'aud-room-004',
      module: 'rooms',
      action: 'ALLOCATE',
      entityName: 'Bed B-310-2 → Rahul Sharma',
      performedBy: 'Warden Kamath',
      details: 'Assigned Bed 2 in Room B-310 (Triple Non-AC) to Rahul Sharma (STU-2024-003).',
      timestamp: '19 Sep 2026, 11:00 AM',
      studentId: 'STU-2024-003',
      userId: 's3',
    },
  ],
  fees: [
    {
      id: 'aud-fee-001',
      module: 'fees',
      action: 'PAYMENT',
      entityName: 'Invoice #INV-2026-001 (₹35,000)',
      performedBy: 'Amit Rathore',
      details: 'Completed online semester accommodation fee payment via UPI (Ref: UPI-99281726). Receipt generated.',
      timestamp: '22 Sep 2026, 11:15 AM',
      studentId: 'STU-2024-001',
      userId: 's1',
    },
    {
      id: 'aud-fee-002',
      module: 'fees',
      action: 'CREATE',
      entityName: 'Mess Tariff Q3 Invoices',
      performedBy: 'Warden Kamath',
      details: 'Dispatched quarterly mess & maintenance fee invoices for all resident students.',
      timestamp: '20 Sep 2026, 10:00 AM',
    },
    {
      id: 'aud-fee-003',
      module: 'fees',
      action: 'STATUS_CHANGE',
      entityName: 'Invoice #INV-2026-004 (Sneha Mehta)',
      performedBy: 'Warden Kamath',
      details: 'Flagged pending due with reminder notification sent to student portal.',
      timestamp: '19 Sep 2026, 04:45 PM',
      studentId: 'STU-2024-004',
      userId: 's4',
    },
  ],
  complaints: [
    {
      id: 'aud-cmp-001',
      module: 'complaints',
      action: 'CREATE',
      entityName: 'Ticket #0045 (Power socket burned out)',
      performedBy: 'Amit Rathore',
      details: 'Lodged urgent electrical complaint for Room A-101 with attached burned socket photo proof.',
      timestamp: '22 Sep 2026, 08:45 AM',
      studentId: 'STU-2024-001',
      userId: 's1',
    },
    {
      id: 'aud-cmp-002',
      module: 'complaints',
      action: 'STATUS_CHANGE',
      entityName: 'Ticket #0044 (Bathroom tap leakage)',
      performedBy: 'Warden Kamath',
      details: 'Assigned plumber K. Verma and updated status to In Progress. Attached inspection report.',
      timestamp: '21 Sep 2026, 02:10 PM',
      studentId: 'STU-2024-004',
      userId: 's4',
    },
    {
      id: 'aud-cmp-003',
      module: 'complaints',
      action: 'UPDATE',
      entityName: 'Ticket #0041 (Flickering lights)',
      performedBy: 'Maintenance Lead R. Das',
      details: 'Replaced faulty switch and starter in Room A-202. Marked ticket Resolved.',
      timestamp: '18 Sep 2026, 05:30 PM',
      studentId: 'STU-2024-006',
      userId: 's6',
    },
  ],
  visitors: [
    {
      id: 'aud-vis-001',
      module: 'visitors',
      action: 'CHECK_IN',
      entityName: 'Visitor: Suresh Rathore',
      performedBy: 'Gate 1 Security Desk',
      details: 'Verified Aadhaar Card and registered family visit check-in for resident Amit Rathore (Room A-101).',
      timestamp: '22 Sep 2026, 10:30 AM',
      studentId: 'STU-2024-001',
      userId: 's1',
    },
    {
      id: 'aud-vis-002',
      module: 'visitors',
      action: 'STATUS_CHANGE',
      entityName: 'Visitor: Deepak Nair',
      performedBy: 'Warden Kamath',
      details: 'Rejected gate pass request due to evening curfew policy.',
      timestamp: '22 Sep 2026, 02:15 PM',
      studentId: 'STU-2024-006',
      userId: 's6',
    },
    {
      id: 'aud-vis-003',
      module: 'visitors',
      action: 'CHECK_IN',
      entityName: 'Visitor: Meena Sharma',
      performedBy: 'Gate 1 Security Desk',
      details: 'Checked in guest Meena Sharma visiting Rahul Sharma (Room B-310).',
      timestamp: '22 Sep 2026, 11:15 AM',
      studentId: 'STU-2024-003',
      userId: 's3',
    },
  ],
  notices: [
    {
      id: 'aud-not-001',
      module: 'notices',
      action: 'CREATE',
      entityName: 'Circular: Water Supply Interruption',
      performedBy: 'Warden Kamath',
      details: 'Published emergency circular regarding pipeline maintenance on 23 Sep 2026.',
      timestamp: '22 Sep 2026, 09:00 AM',
    },
    {
      id: 'aud-not-002',
      module: 'notices',
      action: 'CREATE',
      entityName: 'Notice: Semester Fee Deadline',
      performedBy: 'Warden Kamath',
      details: 'Broadcasted payment deadline reminder for 30 Sep 2026 to all hostel resident portals.',
      timestamp: '20 Sep 2026, 10:30 AM',
    },
  ],
  dashboard: [],
};

export function getAuditHistory(module: AuditModule): AuditRecord[] {
  if (module === 'dashboard') {
    const modules: AuditModule[] = ['students', 'rooms', 'fees', 'complaints', 'visitors', 'notices'];
    const merged: AuditRecord[] = [];
    for (const m of modules) {
      merged.push(...getAuditHistory(m));
    }
    const dashboardDirect = getStoredData<AuditRecord[]>(getStorageKey('dashboard'), []);
    merged.push(...dashboardDirect);
    return merged.sort((a, b) => b.id.localeCompare(a.id));
  }

  const key = getStorageKey(module);
  const defaultLogs = DEFAULT_AUDIT_LOGS[module] || [];
  const stored = getStoredData<AuditRecord[]>(key, defaultLogs);
  if (!stored || stored.length === 0) {
    setStoredData(key, defaultLogs);
    return defaultLogs;
  }
  return stored;
}

export function logAuditAction(
  module: AuditModule,
  action: AuditActionType,
  entityName: string,
  performedBy: string,
  details: string,
  studentId?: string,
  userId?: string
): AuditRecord {
  const currentLogs = getAuditHistory(module);
  const newEntry: AuditRecord = {
    id: `aud-${module}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    module,
    action,
    entityName,
    performedBy: performedBy || 'Administrator',
    details,
    timestamp: formatCurrentTimestamp(),
    studentId,
    userId,
  };

  const updatedLogs = [newEntry, ...currentLogs];
  setStoredData(getStorageKey(module), updatedLogs);
  return newEntry;
}

export function clearAuditHistory(module: AuditModule): void {
  setStoredData(getStorageKey(module), []);
}

export function resetAuditHistory(module: AuditModule): AuditRecord[] {
  const defaults = DEFAULT_AUDIT_LOGS[module] || [];
  setStoredData(getStorageKey(module), defaults);
  return defaults;
}

