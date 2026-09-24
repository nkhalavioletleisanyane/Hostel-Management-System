import type { AuditActionType, AuditModule, AuditRecord } from '../types';
import { getStoredData, setStoredData } from './storage';

const INITIAL_MOCK_AUDIT_LOGS: Record<AuditModule, AuditRecord[]> = {
  students: [
    {
      id: 'aud-stu-1',
      module: 'students',
      action: 'STATUS_CHANGE',
      entityName: 'Rahul Sharma (STU-2024-001)',
      performedBy: 'Warden Dr. K. Rao',
      details: 'Marked student resident status as Active following hostel fee clearance',
      timestamp: '24 Sep 2026, 10:15 AM',
    },
    {
      id: 'aud-stu-2',
      module: 'students',
      action: 'UPDATE',
      entityName: 'Priya Patel (STU-2024-002)',
      performedBy: 'Priya Patel (Self-Service)',
      details: 'Updated emergency contact number to +91 98765 43210 and blood group to O+',
      timestamp: '23 Sep 2026, 04:30 PM',
    },
    {
      id: 'aud-stu-3',
      module: 'students',
      action: 'CREATE',
      entityName: 'Ananya Joshi (STU-2024-005)',
      performedBy: 'SuperAdmin',
      details: 'Enrolled new student resident in B.Tech CSE (Batch 2024)',
      timestamp: '22 Sep 2026, 11:00 AM',
    },
    {
      id: 'aud-stu-4',
      module: 'students',
      action: 'ALLOCATE',
      entityName: 'Amit Rathore (STU-2024-003)',
      performedBy: 'Hostel Admin Office',
      details: 'Allocated Room A-101 (Bed 2) in Block A (Boys)',
      timestamp: '21 Sep 2026, 02:45 PM',
    },
    {
      id: 'aud-stu-5',
      module: 'students',
      action: 'UPDATE',
      entityName: 'Vikram Singh (STU-2024-004)',
      performedBy: 'SuperAdmin',
      details: 'Updated semester assignment to Semester 5 (Mechanical)',
      timestamp: '20 Sep 2026, 09:20 AM',
    },
  ],

  rooms: [
    {
      id: 'aud-room-1',
      module: 'rooms',
      action: 'ALLOCATE',
      entityName: 'Room A-101 (Bed 1)',
      performedBy: 'Warden Office',
      details: 'Allocated Bed 1 to Rahul Sharma (STU-2024-001) for academic year 2026-27',
      timestamp: '24 Sep 2026, 09:15 AM',
    },
    {
      id: 'aud-room-2',
      module: 'rooms',
      action: 'STATUS_CHANGE',
      entityName: 'Room B-204',
      performedBy: 'Maintenance Lead R. Das',
      details: 'Switched room state to "Maintenance" due to bathroom pipe repair work',
      timestamp: '23 Sep 2026, 03:45 PM',
    },
    {
      id: 'aud-room-3',
      module: 'rooms',
      action: 'REQUEST',
      entityName: 'Room A-101',
      performedBy: 'Amit Rathore (Student)',
      details: 'Submitted formal Room Change Request (Preference: Single Occupancy in Block B)',
      timestamp: '23 Sep 2026, 11:20 AM',
    },
    {
      id: 'aud-room-4',
      module: 'rooms',
      action: 'UPDATE',
      entityName: 'Room C-102',
      performedBy: 'SuperAdmin',
      details: 'Updated room amenities config: Wi-Fi router installed and study desks verified',
      timestamp: '22 Sep 2026, 01:10 PM',
    },
    {
      id: 'aud-room-5',
      module: 'rooms',
      action: 'DEALLOCATE',
      entityName: 'Room A-103 (Bed 2)',
      performedBy: 'Hostel Admin',
      details: 'Deallocated bed on student course completion and clearance certificate',
      timestamp: '20 Sep 2026, 12:00 PM',
    },
  ],

  fees: [
    {
      id: 'aud-fee-1',
      module: 'fees',
      action: 'PAYMENT',
      entityName: 'INV-2026-001 (Rahul Sharma)',
      performedBy: 'Accounts Dept / Automated Gateway',
      details: 'Recorded full payment of ₹45,000 for Hostel Sem Fee via UPI (Ref: UPI/20260924/88921)',
      timestamp: '24 Sep 2026, 01:25 PM',
    },
    {
      id: 'aud-fee-2',
      module: 'fees',
      action: 'REQUEST',
      entityName: 'INV-2026-003 (Amit Rathore)',
      performedBy: 'Amit Rathore (Student)',
      details: 'Submitted payment clearance verification request with reference UTR-98234190',
      timestamp: '24 Sep 2026, 10:40 AM',
    },
    {
      id: 'aud-fee-3',
      module: 'fees',
      action: 'CREATE',
      entityName: 'INV-2026-008 (Neha Gupta)',
      performedBy: 'Finance Officer',
      details: 'Generated new Hostel Sem Fee invoice of ₹50,000 with due date 15 Oct 2026',
      timestamp: '23 Sep 2026, 11:15 AM',
    },
    {
      id: 'aud-fee-4',
      module: 'fees',
      action: 'STATUS_CHANGE',
      entityName: 'INV-2026-003 (Amit Rathore)',
      performedBy: 'Automated Billing Cron',
      details: 'Invoice past grace period; auto-transitioned status from Pending to Overdue',
      timestamp: '22 Sep 2026, 06:00 PM',
    },
    {
      id: 'aud-fee-5',
      module: 'fees',
      action: 'UPDATE',
      entityName: 'INV-2026-002 (Priya Patel)',
      performedBy: 'Accounts Admin',
      details: 'Applied early-bird mess waiver of ₹2,500; updated net payable amount',
      timestamp: '20 Sep 2026, 03:30 PM',
    },
  ],

  complaints: [
    {
      id: 'aud-cmp-1',
      module: 'complaints',
      action: 'CREATE',
      entityName: 'CMP-1005 (Room A-101)',
      performedBy: 'Amit Rathore (Student)',
      details: 'Lodged maintenance ticket: Water tap valve leaking continuously in washroom',
      timestamp: '24 Sep 2026, 11:20 AM',
    },
    {
      id: 'aud-cmp-2',
      module: 'complaints',
      action: 'STATUS_CHANGE',
      entityName: 'CMP-1002 (Room B-204)',
      performedBy: 'Facility Supervisor Verma',
      details: 'Changed status to In-Progress; assigned electrician Ramesh to investigate power socket',
      timestamp: '23 Sep 2026, 02:15 PM',
    },
    {
      id: 'aud-cmp-3',
      module: 'complaints',
      action: 'STATUS_CHANGE',
      entityName: 'CMP-0998 (Room C-105)',
      performedBy: 'Chief Warden',
      details: 'Marked complaint as Resolved: Ceiling fan capacitor replaced and signed off',
      timestamp: '22 Sep 2026, 05:40 PM',
    },
    {
      id: 'aud-cmp-4',
      module: 'complaints',
      action: 'CREATE',
      entityName: 'CMP-1001 (Room A-101)',
      performedBy: 'Rahul Sharma (Student)',
      details: 'Lodged ticket: Wi-Fi signal dropping frequently on 1st Floor Block A (Priority High)',
      timestamp: '21 Sep 2026, 08:30 AM',
    },
    {
      id: 'aud-cmp-5',
      module: 'complaints',
      action: 'UPDATE',
      entityName: 'CMP-1003 (Room B-108)',
      performedBy: 'Helpdesk Admin',
      details: 'Escalated priority from Low to Medium based on resident follow-up',
      timestamp: '20 Sep 2026, 04:10 PM',
    },
  ],

  visitors: [
    {
      id: 'aud-vis-1',
      module: 'visitors',
      action: 'CHECK_IN',
      entityName: 'Ramesh Sharma',
      performedBy: 'Gate 1 Security (Guard K. Yadav)',
      details: 'Checked in visitor to meet resident Rahul Sharma (Room A-101). Verified Aadhaar ID',
      timestamp: '24 Sep 2026, 10:15 AM',
    },
    {
      id: 'aud-vis-2',
      module: 'visitors',
      action: 'REQUEST',
      entityName: 'Vikram Rathore',
      performedBy: 'Amit Rathore (Student)',
      details: 'Pre-registered visitor pass for parent arrival on Friday 04:00 PM',
      timestamp: '24 Sep 2026, 08:50 AM',
    },
    {
      id: 'aud-vis-3',
      module: 'visitors',
      action: 'CHECK_OUT',
      entityName: 'Sunita Gupta',
      performedBy: 'Main Gate Security',
      details: 'Visitor logged departure from hostel campus; access pass returned and archived',
      timestamp: '23 Sep 2026, 06:45 PM',
    },
    {
      id: 'aud-vis-4',
      module: 'visitors',
      action: 'CREATE',
      entityName: 'Dr. Arvind Mehta',
      performedBy: 'SuperAdmin',
      details: 'Issued official visitor badge for University Inspection Committee delegation',
      timestamp: '22 Sep 2026, 11:30 AM',
    },
    {
      id: 'aud-vis-5',
      module: 'visitors',
      action: 'CHECK_OUT',
      entityName: 'Kunal Verma',
      performedBy: 'Gate 1 Security',
      details: 'Visitor checked out after academic group discussion in library lounge',
      timestamp: '21 Sep 2026, 05:20 PM',
    },
  ],
};

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

export function getAuditHistory(module: AuditModule): AuditRecord[] {
  const key = getStorageKey(module);
  const initial = INITIAL_MOCK_AUDIT_LOGS[module] || [];
  return getStoredData<AuditRecord[]>(key, initial);
}

export function logAuditAction(
  module: AuditModule,
  action: AuditActionType,
  entityName: string,
  performedBy: string,
  details: string
): AuditRecord {
  const currentLogs = getAuditHistory(module);
  const newEntry: AuditRecord = {
    id: `aud-${module}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    module,
    action,
    entityName,
    performedBy: performedBy || 'System Administrator',
    details,
    timestamp: formatCurrentTimestamp(),
  };

  const updatedLogs = [newEntry, ...currentLogs];
  setStoredData(getStorageKey(module), updatedLogs);
  return newEntry;
}

export function clearAuditHistory(module: AuditModule): void {
  setStoredData(getStorageKey(module), []);
}

export function resetAuditHistory(module: AuditModule): AuditRecord[] {
  const initial = INITIAL_MOCK_AUDIT_LOGS[module] || [];
  setStoredData(getStorageKey(module), initial);
  return initial;
}
