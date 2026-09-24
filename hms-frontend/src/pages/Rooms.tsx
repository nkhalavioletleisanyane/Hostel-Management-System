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
import { mockRooms, mockAllocations, mockStudents } from '../data/mockData';
import type { Room, Allocation, RoomStatus } from '../types';
import { getStoredData, setStoredData } from '../utils/storage';
import { exportToCSV } from '../utils/exportCsv';
import { logAuditAction } from '../utils/auditLogger';
import { useAuth } from '../context/AuthContext';
import {
  Building,
  CheckCircle,
  Key,
  Wrench,
  Download,
  Trash2,
  Edit2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  UserCheck,
  ShieldCheck,
  Send,
  Lock,
  X,
  History
} from 'lucide-react';

const STORAGE_ROOMS_KEY = 'hms_rooms_data';
const STORAGE_ALLOC_KEY = 'hms_allocations_data';

type BlockKey = 'all' | 'A' | 'B' | 'C' | 'D';

const BLOCKS_CONFIG: { key: BlockKey; label: string }[] = [
  { key: 'all', label: 'All Blocks' },
  { key: 'A', label: 'Block A (Boys)' },
  { key: 'B', label: 'Block B (Boys)' },
  { key: 'C', label: 'Block C (Girls)' },
  { key: 'D', label: 'Block D (Girls)' },
];

const ROOM_COLUMNS_CONFIG: ColumnConfig[] = [
  { key: 'select', label: 'Select', visible: true, required: true },
  { key: 'roomNumber', label: 'Room No.', visible: true, required: true },
  { key: 'block', label: 'Block', visible: true },
  { key: 'floor', label: 'Floor', visible: true },
  { key: 'roomType', label: 'Room Type', visible: true },
  { key: 'gender', label: 'Gender', visible: true },
  { key: 'beds', label: 'Bed Capacity', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'actions', label: 'Actions', visible: true, required: true },
];

const ALLOC_COLUMNS_CONFIG: ColumnConfig[] = [
  { key: 'select', label: 'Select', visible: true, required: true },
  { key: 'allocationId', label: 'Alloc ID', visible: true, required: true },
  { key: 'studentName', label: 'Student', visible: true },
  { key: 'roomNumber', label: 'Room', visible: true },
  { key: 'block', label: 'Block', visible: true },
  { key: 'checkInDate', label: 'Check-in', visible: true },
  { key: 'checkOutDate', label: 'Check-out', visible: false },
  { key: 'status', label: 'Status', visible: true },
  { key: 'actions', label: 'Actions', visible: true, required: true },
];

type RoomSortField = 'roomNumber' | 'block' | 'floor' | 'roomType' | 'totalBeds' | 'status';
type AllocSortField = 'allocationId' | 'studentName' | 'roomNumber' | 'checkInDate' | 'status';
type SortOrder = 'asc' | 'desc';

const RoomTile: React.FC<{ room: Room; onClick: (r: Room) => void }> = ({ room, onClick }) => {
  const cls =
    room.status === 'full'
      ? 'room-tile full'
      : room.status === 'maintenance'
      ? 'room-tile maintenance'
      : room.occupiedBeds === 0
      ? 'room-tile vacant'
      : 'room-tile partial';

  return (
    <div className={cls} onClick={() => onClick(room)}>
      <div className="room-tile-num">{room.roomNumber}</div>
      <div className="room-tile-label">
        {room.occupiedBeds}/{room.totalBeds} beds ·{' '}
        {room.status === 'full'
          ? 'Full'
          : room.status === 'maintenance'
          ? 'Maintenance'
          : room.occupiedBeds === 0
          ? 'Vacant'
          : 'Available'}
      </div>
      <div className="room-tile-beds">
        {Array.from({ length: room.totalBeds }, (_, i) => (
          <div key={i} className={`bed-dot ${i < room.occupiedBeds ? 'taken' : 'free'}`} />
        ))}
      </div>
    </div>
  );
};

const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(() =>
    getStoredData<Room[]>(STORAGE_ROOMS_KEY, mockRooms)
  );
  const [allocations, setAllocations] = useState<Allocation[]>(() =>
    getStoredData<Allocation[]>(STORAGE_ALLOC_KEY, mockAllocations)
  );

  useEffect(() => {
    setStoredData(STORAGE_ROOMS_KEY, rooms);
  }, [rooms]);

  useEffect(() => {
    setStoredData(STORAGE_ALLOC_KEY, allocations);
  }, [allocations]);

  // View state: 'grid' or 'table'
  const [activeView, setActiveView] = useState<'table' | 'grid'>('table');
  const [activeBlock, setActiveBlock] = useState<BlockKey>('all');

  // Room Table states
  const [roomColumns, setRoomColumns] = useState<ColumnConfig[]>(ROOM_COLUMNS_CONFIG);
  const [roomSearch, setRoomSearch] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [roomSortField, setRoomSortField] = useState<RoomSortField | null>('roomNumber');
  const [roomSortOrder, setRoomSortOrder] = useState<SortOrder>('asc');
  const [roomPage, setRoomPage] = useState(1);
  const [roomPageSize, setRoomPageSize] = useState(10);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // Alloc Table states
  const [allocColumns, setAllocColumns] = useState<ColumnConfig[]>(ALLOC_COLUMNS_CONFIG);
  const [allocSearch, setAllocSearch] = useState('');
  const [allocStatusFilter, setAllocStatusFilter] = useState('');
  const [allocSortField, setAllocSortField] = useState<AllocSortField | null>('allocationId');
  const [allocSortOrder, setAllocSortOrder] = useState<SortOrder>('desc');
  const [allocPage, setAllocPage] = useState(1);
  const [allocPageSize, setAllocPageSize] = useState(5);
  const [selectedAllocIds, setSelectedAllocIds] = useState<string[]>([]);

  // Modals
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingAlloc, setEditingAlloc] = useState<Allocation | null>(null);

  // Confirm delete modals
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [showBulkDeleteRoomsConfirm, setShowBulkDeleteRoomsConfirm] = useState(false);
  const [allocToDelete, setAllocToDelete] = useState<Allocation | null>(null);
  const [showBulkDeleteAllocConfirm, setShowBulkDeleteAllocConfirm] = useState(false);

  // Forms
  const initialRoomForm = {
    roomNumber: '',
    block: 'A' as Room['block'],
    floor: 1,
    totalBeds: 2,
    roomType: 'Double' as Room['roomType'],
    gender: 'Boys' as Room['gender'],
    status: 'available' as RoomStatus,
  };
  const [roomForm, setRoomForm] = useState(initialRoomForm);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [allocForm, setAllocForm] = useState(() => ({
    studentId: '',
    roomId: '',
    checkInDate: new Date().toISOString().slice(0, 10),
  }));

  // KPI Calculations
  const totalRooms = rooms.length;
  const occupied = rooms.filter(r => r.status === 'full').length;
  const vacant = rooms.filter(r => r.occupiedBeds === 0 && r.status !== 'maintenance').length;
  const maintenance = rooms.filter(r => r.status === 'maintenance').length;

  const unassignedStudents = mockStudents.filter(s => !s.roomId);
  const availableRooms = rooms.filter(
    r => r.status === 'available' || (r.occupiedBeds < r.totalBeds && r.status !== 'maintenance')
  );

  const resetAllData = () => {
    if (confirm('Reset room inventory and allocation records to default demo data?')) {
      setRooms(mockRooms);
      setAllocations(mockAllocations);
      setSelectedRoomIds([]);
      setSelectedAllocIds([]);
      logAuditAction(
        'rooms',
        'RESET',
        'All Room & Bed Records',
        user?.name || 'Administrator',
        'Restored default room inventory and bed allocations'
      );
    }
  };

  // ROOM TABLE: Sort and Filter
  const handleRoomSort = (field: RoomSortField) => {
    if (roomSortField === field) {
      setRoomSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setRoomSortField(field);
      setRoomSortOrder('asc');
    }
  };

  const filteredRooms = rooms.filter(r => {
    const q = roomSearch.toLowerCase();
    const matchQ =
      r.roomNumber.toLowerCase().includes(q) ||
      r.blockLabel.toLowerCase().includes(q) ||
      r.roomType.toLowerCase().includes(q) ||
      `floor ${r.floor}`.toLowerCase().includes(q);

    const matchB = activeBlock === 'all' || r.block === activeBlock;
    const matchS = !roomStatusFilter || r.status === roomStatusFilter;
    const matchT = !roomTypeFilter || r.roomType === roomTypeFilter;
    return matchQ && matchB && matchS && matchT;
  });

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (!roomSortField) return 0;
    let aVal: any = a[roomSortField];
    let bVal: any = b[roomSortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    if (aVal < bVal) return roomSortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return roomSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const isRoomsAll = roomPageSize >= 9999;
  const paginatedRooms = isRoomsAll
    ? sortedRooms
    : sortedRooms.slice((roomPage - 1) * roomPageSize, roomPage * roomPageSize);

  // ALLOC TABLE: Sort and Filter
  const handleAllocSort = (field: AllocSortField) => {
    if (allocSortField === field) {
      setAllocSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setAllocSortField(field);
      setAllocSortOrder('asc');
    }
  };

  const filteredAllocs = allocations.filter(a => {
    const q = allocSearch.toLowerCase();
    const matchQ =
      a.allocationId.toLowerCase().includes(q) ||
      a.studentName.toLowerCase().includes(q) ||
      a.roomNumber.toLowerCase().includes(q) ||
      a.block.toLowerCase().includes(q);

    const matchS = !allocStatusFilter || a.status === allocStatusFilter;
    const matchB =
      activeBlock === 'all' ||
      a.block.toLowerCase().includes(`block ${activeBlock.toLowerCase()}`);
    return matchQ && matchS && matchB;
  });

  const sortedAllocs = [...filteredAllocs].sort((a, b) => {
    if (!allocSortField) return 0;
    let aVal: any = a[allocSortField] || '';
    let bVal: any = b[allocSortField] || '';

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    if (aVal < bVal) return allocSortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return allocSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const isAllocsAll = allocPageSize >= 9999;
  const paginatedAllocs = isAllocsAll
    ? sortedAllocs
    : sortedAllocs.slice((allocPage - 1) * allocPageSize, allocPage * allocPageSize);

  // ROOM ACTIONS
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const blockLabel = `Block ${roomForm.block} (${roomForm.gender})`;
    const newRoom: Room = {
      id: `r_${Date.now()}`,
      roomNumber: roomForm.roomNumber.trim().toUpperCase(),
      block: roomForm.block,
      blockLabel,
      floor: Number(roomForm.floor),
      totalBeds: Number(roomForm.totalBeds),
      occupiedBeds: 0,
      roomType: roomForm.roomType,
      gender: roomForm.gender,
      status: roomForm.status,
    };

    setRooms(prev => [newRoom, ...prev]);
    setShowAddRoomModal(false);
    setRoomForm(initialRoomForm);

    logAuditAction(
      'rooms',
      'CREATE',
      `Room ${newRoom.roomNumber} (${newRoom.blockLabel})`,
      user?.name || 'Administrator',
      `Added new ${newRoom.roomType} room with ${newRoom.totalBeds} bed capacity on Floor ${newRoom.floor}`
    );
  };

  const openEditRoom = (r: Room) => {
    setEditingRoom(r);
    setRoomForm({
      roomNumber: r.roomNumber,
      block: r.block,
      floor: r.floor,
      totalBeds: r.totalBeds,
      roomType: r.roomType,
      gender: r.gender,
      status: r.status,
    });
  };

  const handleEditRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    const blockLabel = `Block ${roomForm.block} (${roomForm.gender})`;

    setRooms(prev =>
      prev.map(r => {
        if (r.id === editingRoom.id) {
          const totalBeds = Number(roomForm.totalBeds);
          const occupiedBeds = Math.min(r.occupiedBeds, totalBeds);
          let newStatus = roomForm.status;
          if (newStatus !== 'maintenance') {
            newStatus = occupiedBeds >= totalBeds ? 'full' : 'available';
          }
          return {
            ...r,
            roomNumber: roomForm.roomNumber.trim().toUpperCase(),
            block: roomForm.block,
            blockLabel,
            floor: Number(roomForm.floor),
            totalBeds,
            occupiedBeds,
            roomType: roomForm.roomType,
            gender: roomForm.gender,
            status: newStatus,
          };
        }
        return r;
      })
    );

    logAuditAction(
      'rooms',
      'UPDATE',
      `Room ${roomForm.roomNumber.trim().toUpperCase()} (${blockLabel})`,
      user?.name || 'Administrator',
      `Updated room specifications: Status: ${roomForm.status}, Capacity: ${roomForm.totalBeds} beds`
    );

    setEditingRoom(null);
  };

  const handleDeleteRoomConfirm = () => {
    if (!roomToDelete) return;
    setRooms(prev => prev.filter(r => r.id !== roomToDelete.id));
    setSelectedRoomIds(prev => prev.filter(id => id !== roomToDelete.id));

    logAuditAction(
      'rooms',
      'DELETE',
      `Room ${roomToDelete.roomNumber} (${roomToDelete.blockLabel})`,
      user?.name || 'Administrator',
      `Removed room from hostel inventory`
    );

    setRoomToDelete(null);
  };

  const handleBulkDeleteRooms = () => {
    logAuditAction(
      'rooms',
      'BULK_DELETE',
      `${selectedRoomIds.length} Rooms`,
      user?.name || 'Administrator',
      `Bulk deleted ${selectedRoomIds.length} rooms from database`
    );

    setRooms(prev => prev.filter(r => !selectedRoomIds.includes(r.id)));
    setSelectedRoomIds([]);
    setShowBulkDeleteRoomsConfirm(false);
  };

  const handleQuickRoomStatus = (id: string, status: RoomStatus) => {
    const target = rooms.find(r => r.id === id);
    if (target) {
      logAuditAction(
        'rooms',
        'STATUS_CHANGE',
        `Room ${target.roomNumber}`,
        user?.name || 'Administrator',
        `Quick changed room status from ${target.status} to ${status}`
      );
    }
    setRooms(prev =>
      prev.map(r => (r.id === id ? { ...r, status } : r))
    );
  };

  // ALLOCATION ACTIONS
  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocForm.studentId || !allocForm.roomId) return;

    const student = unassignedStudents.find(
      s => `${s.firstName} ${s.lastName} (${s.studentId})` === allocForm.studentId
    );
    const room = availableRooms.find(r => `${r.roomNumber} — ${r.blockLabel}` === allocForm.roomId);

    if (!student || !room) {
      alert('Please select a valid student and room from the dropdown suggestions.');
      return;
    }

    const newAlloc: Allocation = {
      id: `al_${Date.now()}`,
      allocationId: `ALC-2024-${String(allocations.length + 1).padStart(3, '0')}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      roomId: room.id,
      roomNumber: room.roomNumber,
      block: room.blockLabel,
      checkInDate: allocForm.checkInDate,
      status: 'active',
    };

    setAllocations(prev => [newAlloc, ...prev]);

    logAuditAction(
      'rooms',
      'ALLOCATE',
      `Room ${room.roomNumber} (${newAlloc.allocationId})`,
      user?.name || 'Administrator',
      `Allocated bed to resident student ${student.firstName} ${student.lastName} (${student.studentId || ''})`
    );

    // Update room occupancy
    setRooms(prev =>
      prev.map(r => {
        if (r.id === room.id) {
          const newOccupied = r.occupiedBeds + 1;
          return {
            ...r,
            occupiedBeds: newOccupied,
            status: newOccupied >= r.totalBeds ? 'full' : 'available',
          };
        }
        return r;
      })
    );

    setShowAllocModal(false);
    setAllocForm({ studentId: '', roomId: '', checkInDate: new Date().toISOString().slice(0, 10) });
  };

  const handleVacate = (allocId: string) => {
    const alloc = allocations.find(a => a.allocationId === allocId || a.id === allocId);
    if (!alloc) return;

    logAuditAction(
      'rooms',
      'DEALLOCATE',
      `Room ${alloc.roomNumber} (${alloc.allocationId})`,
      user?.name || 'Administrator',
      `Deallocated bed and marked occupancy completed for resident ${alloc.studentName}`
    );

    setAllocations(prev =>
      prev.map(a =>
        a.id === alloc.id
          ? { ...a, status: 'completed', checkOutDate: new Date().toISOString().slice(0, 10) }
          : a
      )
    );

    // Free up bed in room
    setRooms(prev =>
      prev.map(r => {
        if (r.id === alloc.roomId || r.roomNumber === alloc.roomNumber) {
          const newOccupied = Math.max(0, r.occupiedBeds - 1);
          return {
            ...r,
            occupiedBeds: newOccupied,
            status: r.status === 'maintenance' ? 'maintenance' : newOccupied >= r.totalBeds ? 'full' : 'available',
          };
        }
        return r;
      })
    );
  };

  const openEditAlloc = (alloc: Allocation) => {
    setEditingAlloc(alloc);
  };

  const handleEditAllocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlloc) return;
    setAllocations(prev =>
      prev.map(a => (a.id === editingAlloc.id ? editingAlloc : a))
    );
    setEditingAlloc(null);
  };

  const handleDeleteAllocConfirm = () => {
    if (!allocToDelete) return;

    logAuditAction(
      'rooms',
      'DELETE',
      `Allocation ${allocToDelete.allocationId}`,
      user?.name || 'Administrator',
      `Deleted room allocation record of resident ${allocToDelete.studentName} for Room ${allocToDelete.roomNumber}`
    );

    setAllocations(prev => prev.filter(a => a.id !== allocToDelete.id));
    setSelectedAllocIds(prev => prev.filter(id => id !== allocToDelete.id));
    setAllocToDelete(null);
  };

  const handleBulkDeleteAlloc = () => {
    logAuditAction(
      'rooms',
      'BULK_DELETE',
      `${selectedAllocIds.length} Allocation Records`,
      user?.name || 'Administrator',
      `Bulk deleted ${selectedAllocIds.length} allocation records from database`
    );

    setAllocations(prev => prev.filter(a => !selectedAllocIds.includes(a.id)));
    setSelectedAllocIds([]);
    setShowBulkDeleteAllocConfirm(false);
  };

  // EXPORT CSVs
  const handleExportRooms = () => {
    exportToCSV<Room>('rooms_inventory', sortedRooms, [
      { key: 'roomNumber', label: 'Room Number' },
      { key: 'block', label: 'Block' },
      { key: 'floor', label: 'Floor' },
      { key: 'roomType', label: 'Room Type' },
      { key: 'gender', label: 'Gender' },
      { key: 'totalBeds', label: 'Total Beds' },
      { key: 'occupiedBeds', label: 'Occupied Beds' },
      {
        key: 'vacantBeds',
        label: 'Vacant Beds',
        format: r => Math.max(0, r.totalBeds - r.occupiedBeds),
      },
      { key: 'status', label: 'Status' },
    ]);
  };

  const handleExportAllocs = () => {
    exportToCSV<Allocation>('allocations_log', sortedAllocs, [
      { key: 'allocationId', label: 'Allocation ID' },
      { key: 'studentName', label: 'Student Name' },
      { key: 'roomNumber', label: 'Room' },
      { key: 'block', label: 'Block' },
      { key: 'checkInDate', label: 'Check-in Date' },
      { key: 'checkOutDate', label: 'Check-out Date', format: a => a.checkOutDate || '—' },
      { key: 'status', label: 'Status' },
    ]);
  };

  const isRoomColVisible = (key: string) => {
    const col = roomColumns.find(c => c.key === key);
    return col ? col.visible : true;
  };

  const isAllocColVisible = (key: string) => {
    const col = allocColumns.find(c => c.key === key);
    return col ? col.visible : true;
  };

  const renderRoomSortIndicator = (field: RoomSortField) => {
    if (roomSortField !== field) return <ArrowUpDown size={12} className="sort-icon" />;
    return roomSortOrder === 'asc' ? <ArrowUp size={12} className="sort-icon" /> : <ArrowDown size={12} className="sort-icon" />;
  };

  const renderAllocSortIndicator = (field: AllocSortField) => {
    if (allocSortField !== field) return <ArrowUpDown size={12} className="sort-icon" />;
    return allocSortOrder === 'asc' ? <ArrowUp size={12} className="sort-icon" /> : <ArrowDown size={12} className="sort-icon" />;
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
    blockName: 'Block A',
    checkInDate: '2024-08-01',
    status: 'active' as const,
  };

  const myRoom = rooms.find(r => r.roomNumber === currentStudent.roomNumber) || {
    id: 'r1',
    roomNumber: currentStudent.roomNumber || 'A-101',
    block: 'A' as const,
    blockLabel: 'Block A (Boys)',
    floor: 1,
    totalBeds: 2,
    occupiedBeds: 2,
    roomType: 'Double' as const,
    status: 'full' as const,
    gender: 'Boys' as const,
  };

  const myAlloc = allocations.find(a =>
    a.studentId === currentStudent.id ||
    a.studentName.toLowerCase().includes(currentStudent.firstName.toLowerCase())
  );

  // Student Room Requests state
  const STORAGE_ROOM_REQ_KEY = 'hms_room_requests_data';
  const defaultRoomRequests = [
    {
      id: 'req_101',
      studentId: currentStudent.id,
      requestType: 'Room Change Request',
      targetBlock: 'Block A',
      preferredFloor: '2nd Floor Double',
      reason: 'Requested quiet study floor on upper level.',
      date: '2026-09-15',
      status: 'Pending Warden Review',
    },
  ];

  const [roomRequests, setRoomRequests] = useState(() =>
    getStoredData(STORAGE_ROOM_REQ_KEY, defaultRoomRequests)
  );

  useEffect(() => {
    setStoredData(STORAGE_ROOM_REQ_KEY, roomRequests);
  }, [roomRequests]);

  const [showRoomReqModal, setShowRoomReqModal] = useState(false);
  const [roomReqSuccess, setRoomReqSuccess] = useState('');
  const [roomReqForm, setRoomReqForm] = useState({
    requestType: 'Room Change Request',
    targetBlock: 'Block A (Boys)',
    preferredType: 'Single Room',
    reason: '',
  });

  const handleRoomReqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomReqForm.reason.trim()) return;

    const newReq = {
      id: `req_${Date.now()}`,
      studentId: currentStudent.id,
      requestType: roomReqForm.requestType,
      targetBlock: roomReqForm.targetBlock,
      preferredFloor: roomReqForm.preferredType,
      reason: roomReqForm.reason.trim(),
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending Warden Review',
    };

    setRoomRequests(prev => [newReq, ...prev]);
    setShowRoomReqModal(false);
    setRoomReqForm({
      requestType: 'Room Change Request',
      targetBlock: 'Block A (Boys)',
      preferredType: 'Single Room',
      reason: '',
    });
    setRoomReqSuccess(
      `Room request "${newReq.requestType}" submitted successfully! Warden Kamath will review your request.`
    );

    logAuditAction(
      'rooms',
      'REQUEST',
      `Room ${currentStudent.roomNumber || 'A-101'}`,
      `${currentStudent.firstName} ${currentStudent.lastName} (Student)`,
      `Submitted ${newReq.requestType}: "${newReq.reason.slice(0, 80)}"`
    );
  };

  // ============================================================
  // STUDENT VIEW (Only view assigned room & submit room requests)
  // ============================================================
  if (isStudent) {
    return (
      <PageLayout>
        <div className="student-profile-container">
          <div className="page-header-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 className="page-title" style={{ margin: 0 }}>My Room Allotment</h1>
                <span className="profile-pill highlight">
                  <ShieldCheck size={14} /> Student Access
                </span>
              </div>
              <p className="page-subtitle">
                Room specifications, facility overview & warden request center for {currentStudent.firstName} {currentStudent.lastName}
              </p>
            </div>
            <div className="page-header-actions">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => setShowHistoryModal(true)}
                title="View room allotment & request activity history"
              >
                <History size={14} />
                <span>History</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowRoomReqModal(true)}
              >
                <Plus size={15} />
                <span>Submit Room Request</span>
              </button>
            </div>
          </div>

          {roomReqSuccess && (
            <div className="student-alert-success">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={18} />
                <span>{roomReqSuccess}</span>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setRoomReqSuccess('')}
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
                <strong>Confidential Accommodation Boundary:</strong> You are viewing only your assigned room (<strong>Room {currentStudent.roomNumber || 'A-101'}</strong>, {currentStudent.blockName || 'Block A'}).
              </div>
              <div style={{ marginTop: 4, opacity: 0.9, fontSize: '0.84rem' }}>
                Hostel-wide block layouts, inventory addition, and bed management are strictly reserved for the Hostel Warden. You can submit room change or repair requests below.
              </div>
            </div>
          </div>

          {/* Room Hero Card */}
          <div className="profile-hero-card">
            <div className="profile-hero-left">
              <div
                className="profile-hero-avatar"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                <Key size={36} />
              </div>
              <div className="profile-hero-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 className="profile-hero-name">
                    Room {myRoom.roomNumber}
                  </h2>
                  <Badge variant={myRoom.status === 'full' ? 'full' : 'vacant'}>
                    {myRoom.status === 'full' ? 'Fully Occupied' : 'Available Beds'}
                  </Badge>
                </div>
                <div className="profile-hero-badges">
                  <span className="profile-pill room-pill">
                    <Building size={13} /> {myRoom.blockLabel}
                  </span>
                  <span className="profile-pill highlight">
                    Floor {myRoom.floor}
                  </span>
                  <span className="profile-pill">
                    {myRoom.roomType} Room ({myRoom.occupiedBeds}/{myRoom.totalBeds} beds)
                  </span>
                  <span className="profile-pill">
                    {myRoom.gender} Wing
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Bed Allocation
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'flex-end' }}>
                  {Array.from({ length: myRoom.totalBeds }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: i < myRoom.occupiedBeds ? 'var(--clr-primary)' : 'var(--clr-border)',
                      }}
                      title={i < myRoom.occupiedBeds ? 'Bed Occupied' : 'Bed Vacant'}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => setShowRoomReqModal(true)}
              >
                <Send size={13} /> Request Change
              </button>
            </div>
          </div>

          {/* Details & Requests Grid */}
          <div className="profile-sections-grid">
            {/* Card 1: Room Specs & Facilities */}
            <div className="profile-card">
              <div className="profile-card-header">
                <h3 className="profile-card-title">
                  <Building size={17} style={{ color: 'var(--clr-primary)' }} />
                  <span>Room Specifications & Facilities</span>
                </h3>
                <span className="field-tag locked"><Lock size={11} /> Warden Verified</span>
              </div>

              <div className="profile-card-body">
                <div className="profile-fields-grid">
                  <div className="profile-field-box">
                    <span className="profile-field-label">Allocation ID</span>
                    <span className="profile-field-val" style={{ fontFamily: 'monospace' }}>
                      {myAlloc?.allocationId || 'ALLOC-001'}
                    </span>
                  </div>

                  <div className="profile-field-box">
                    <span className="profile-field-label">Check-in Date</span>
                    <span className="profile-field-val">
                      {currentStudent.checkInDate || '01 Aug 2024'}
                    </span>
                  </div>

                  <div className="profile-field-box">
                    <span className="profile-field-label">Bed Type & Capacity</span>
                    <span className="profile-field-val">
                      {myRoom.roomType} ({myRoom.totalBeds} Beds)
                    </span>
                  </div>

                  <div className="profile-field-box">
                    <span className="profile-field-label">Floor Level</span>
                    <span className="profile-field-val">
                      Floor {myRoom.floor}
                    </span>
                  </div>

                  <div className="profile-field-box" style={{ gridColumn: 'span 2' }}>
                    <span className="profile-field-label">Included Room Amenities</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      {['High-Speed Wi-Fi', 'Study Desks', 'Attached Bath', 'Balcony', 'Personal Wardrobe'].map(am => (
                        <span key={am} className="profile-pill" style={{ fontSize: '0.72rem' }}>
                          ✓ {am}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-card-footer-notice">
                <Lock size={14} />
                <span>
                  Room allocations are official institutional records. Bed or room alterations require prior authorization from the chief warden.
                </span>
              </div>
            </div>

            {/* Card 2: My Submitted Room Requests */}
            <div className="profile-card">
              <div className="profile-card-header">
                <h3 className="profile-card-title">
                  <Send size={17} style={{ color: 'var(--clr-primary)' }} />
                  <span>My Room Service & Change Requests</span>
                </h3>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowRoomReqModal(true)}
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  <Plus size={12} /> New Request
                </button>
              </div>

              <div className="profile-card-body">
                {roomRequests.map(r => (
                  <div
                    key={r.id}
                    style={{
                      background: 'var(--clr-bg)',
                      border: '1px solid var(--clr-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.requestType}</span>
                      <Badge variant="pending">{r.status}</Badge>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--clr-text-secondary)' }}>
                      {r.reason}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', display: 'flex', gap: 12, marginTop: 2 }}>
                      <span>Target: {r.targetBlock}</span>
                      <span>Submitted: {r.date}</span>
                    </div>
                  </div>
                ))}

                {roomRequests.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--clr-text-muted)', fontSize: '0.86rem' }}>
                    No active room requests. Click "+ New Request" to request a room change or maintenance.
                  </div>
                )}
              </div>

              <div className="profile-card-footer-notice">
                <CheckCircle size={14} style={{ color: 'var(--clr-success)' }} />
                <span>
                  Warden reviews pending room requests every Wednesday and Saturday.
                </span>
              </div>
            </div>
          </div>

          {/* SUBMIT ROOM REQUEST MODAL */}
          {showRoomReqModal && (
            <Modal
              isOpen={showRoomReqModal}
              onClose={() => setShowRoomReqModal(false)}
              title="Submit Room Request to Warden"
            >
              <form onSubmit={handleRoomReqSubmit}>
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
                      Current Resident
                    </span>
                    <div style={{ fontWeight: 600 }}>{currentStudent.firstName} {currentStudent.lastName}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Current Room
                    </span>
                    <div style={{ fontWeight: 600 }}>Room {currentStudent.roomNumber || 'A-101'}</div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Request Type *</label>
                  <select
                    className="form-select"
                    value={roomReqForm.requestType}
                    onChange={e => setRoomReqForm(f => ({ ...f, requestType: e.target.value }))}
                  >
                    <option value="Room Change Request">Room Change Request</option>
                    <option value="Maintenance / Fix Request">Maintenance / Fix Request</option>
                    <option value="Bed Switch Request">Bed Switch Request</option>
                    <option value="Vacate / Check-out Request">Vacate / Check-out Request</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Preferred Block</label>
                    <select
                      className="form-select"
                      value={roomReqForm.targetBlock}
                      onChange={e => setRoomReqForm(f => ({ ...f, targetBlock: e.target.value }))}
                    >
                      <option value="Block A (Boys)">Block A (Boys)</option>
                      <option value="Block B (Boys)">Block B (Boys)</option>
                      <option value="Block C (Girls)">Block C (Girls)</option>
                      <option value="Block D (Girls)">Block D (Girls)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Preferred Room Type</label>
                    <select
                      className="form-select"
                      value={roomReqForm.preferredType}
                      onChange={e => setRoomReqForm(f => ({ ...f, preferredType: e.target.value }))}
                    >
                      <option value="Single Room">Single Room</option>
                      <option value="Double Room">Double Room</option>
                      <option value="Triple Room">Triple Room</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Reason & Justification *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={roomReqForm.reason}
                    onChange={e => setRoomReqForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Provide details for your request (e.g., medical reasons, study environment, room maintenance issues)…"
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-dark" onClick={() => setShowRoomReqModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Request to Warden ✓
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* Student Room Activity History Modal */}
          <HistoryModal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            moduleName="rooms"
            title="My Room Allotment & Request History"
          />
        </div>
      </PageLayout>
    );
  }

  // ============================================================
  // ADMIN VIEW (Full master room & allocation control)
  // ============================================================
  return (
    <PageLayout>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Room & Bed Management</h1>
          <p className="page-subtitle">
            Hostel block inventory, bed capacity and dynamic resident allocation
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
            onClick={() => setShowAllocModal(true)}
          >
            <UserCheck size={14} />
            <span>Allocate Room</span>
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => setShowHistoryModal(true)}
            title="View room & bed activity history log"
          >
            <History size={14} />
            <span>History</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setRoomForm(initialRoomForm);
              setShowAddRoomModal(true);
            }}
          >
            <Plus size={15} />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Rooms"
          value={totalRooms}
          change="Inventory across blocks"
          changeType="neutral"
          accent="green"
          icon={<Building size={24} />}
        />
        <KpiCard
          label="Full Rooms"
          value={occupied}
          change={`${((occupied / (totalRooms || 1)) * 100).toFixed(0)}% full`}
          changeType="up"
          accent="accent"
          icon={<CheckCircle size={24} />}
          delay={0.1}
        />
        <KpiCard
          label="Vacant / Partial"
          value={vacant}
          change="Available for allotment"
          changeType="up"
          accent="warning"
          icon={<Key size={24} />}
          delay={0.2}
        />
        <KpiCard
          label="Maintenance"
          value={maintenance}
          change="Temporarily offline"
          changeType="down"
          accent="danger"
          icon={<Wrench size={24} />}
          delay={0.3}
        />
      </div>

      {/* BLOCK TABS & VIEW TOGGLE ROW */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          {BLOCKS_CONFIG.map(b => (
            <button
              key={b.key}
              className={`filter-tab ${activeBlock === b.key ? 'active' : ''}`}
              onClick={() => {
                setActiveBlock(b.key);
                setRoomPage(1);
                setAllocPage(1);
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, background: 'var(--clr-surface)', padding: 4, borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeView === 'table' ? 'btn-primary' : 'btn-outline-dark'}`}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            onClick={() => setActiveView('table')}
          >
            <TableIcon size={14} />
            <span>Table View</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeView === 'grid' ? 'btn-primary' : 'btn-outline-dark'}`}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            onClick={() => setActiveView('grid')}
          >
            <LayoutGrid size={14} />
            <span>Grid View</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: GRID VIEW */}
      {activeView === 'grid' && (
        <div style={{ marginBottom: 28 }}>
          <div className="room-legend" style={{ marginBottom: 14 }}>
            <span>Legend:</span>
            {[
              { cls: 'full', label: 'Full' },
              { cls: 'vacant', label: 'Vacant' },
              { cls: 'partial', label: 'Partial' },
              { cls: 'maintenance', label: 'Maintenance' },
            ].map(l => (
              <span key={l.cls} className={`legend-item legend-${l.cls}`}>
                {l.label}
              </span>
            ))}
          </div>

          <div className="room-grid">
            {filteredRooms.map(r => (
              <RoomTile key={r.id} room={r} onClick={setSelectedRoom} />
            ))}
            {filteredRooms.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
                No rooms match the selected block filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: CUSTOMIZABLE ROOM INVENTORY TABLE */}
      {activeView === 'table' && (
        <div className="data-table-card" style={{ marginBottom: 28 }}>
          <div className="data-table-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3>Room Inventory Directory</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                ({sortedRooms.length} rooms)
              </span>
            </div>

            <div className="table-controls">
              <select
                className="search-input"
                style={{ width: 130 }}
                value={roomStatusFilter}
                onChange={e => {
                  setRoomStatusFilter(e.target.value);
                  setRoomPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="full">Full</option>
                <option value="maintenance">Maintenance</option>
              </select>

              <select
                className="search-input"
                style={{ width: 130 }}
                value={roomTypeFilter}
                onChange={e => {
                  setRoomTypeFilter(e.target.value);
                  setRoomPage(1);
                }}
              >
                <option value="">All Room Types</option>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Triple">Triple</option>
                <option value="Dormitory">Dormitory</option>
              </select>

              <input
                className="search-input"
                placeholder="Search room, floor, type…"
                value={roomSearch}
                onChange={e => {
                  setRoomSearch(e.target.value);
                  setRoomPage(1);
                }}
              />

              <ColumnVisibilityDropdown columns={roomColumns} onChange={setRoomColumns} />

              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={handleExportRooms}
                title="Export rooms to CSV"
              >
                <Download size={14} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Bulk Action for Rooms */}
          {selectedRoomIds.length > 0 && (
            <div style={{ padding: '0 20px', paddingTop: 14 }}>
              <BulkActionBar
                selectedCount={selectedRoomIds.length}
                totalCount={sortedRooms.length}
                onClear={() => setSelectedRoomIds([])}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)', fontWeight: 600 }}>
                    Bulk Actions:
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    onClick={() => {
                      setRooms(prev =>
                        prev.map(r => (selectedRoomIds.includes(r.id) ? { ...r, status: 'maintenance' } : r))
                      );
                    }}
                  >
                    Set Maintenance
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setShowBulkDeleteRoomsConfirm(true)}
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
                  {isRoomColVisible('select') && (
                    <th style={{ width: 40, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={sortedRooms.length > 0 && selectedRoomIds.length === sortedRooms.length}
                        onChange={e => {
                          if (e.target.checked) setSelectedRoomIds(sortedRooms.map(r => r.id));
                          else setSelectedRoomIds([]);
                        }}
                      />
                    </th>
                  )}
                  {isRoomColVisible('roomNumber') && (
                    <th className="sortable" onClick={() => handleRoomSort('roomNumber')}>
                      <div className={`th-sort-wrapper ${roomSortField === 'roomNumber' ? 'active' : ''}`}>
                        <span>Room No.</span>
                        {renderRoomSortIndicator('roomNumber')}
                      </div>
                    </th>
                  )}
                  {isRoomColVisible('block') && (
                    <th className="sortable" onClick={() => handleRoomSort('block')}>
                      <div className={`th-sort-wrapper ${roomSortField === 'block' ? 'active' : ''}`}>
                        <span>Block</span>
                        {renderRoomSortIndicator('block')}
                      </div>
                    </th>
                  )}
                  {isRoomColVisible('floor') && (
                    <th className="sortable" onClick={() => handleRoomSort('floor')}>
                      <div className={`th-sort-wrapper ${roomSortField === 'floor' ? 'active' : ''}`}>
                        <span>Floor</span>
                        {renderRoomSortIndicator('floor')}
                      </div>
                    </th>
                  )}
                  {isRoomColVisible('roomType') && (
                    <th className="sortable" onClick={() => handleRoomSort('roomType')}>
                      <div className={`th-sort-wrapper ${roomSortField === 'roomType' ? 'active' : ''}`}>
                        <span>Type</span>
                        {renderRoomSortIndicator('roomType')}
                      </div>
                    </th>
                  )}
                  {isRoomColVisible('gender') && <th>Hostel Gender</th>}
                  {isRoomColVisible('beds') && (
                    <th className="sortable" onClick={() => handleRoomSort('totalBeds')}>
                      <div className={`th-sort-wrapper ${roomSortField === 'totalBeds' ? 'active' : ''}`}>
                        <span>Capacity</span>
                        {renderRoomSortIndicator('totalBeds')}
                      </div>
                    </th>
                  )}
                  {isRoomColVisible('status') && (
                    <th className="sortable" onClick={() => handleRoomSort('status')}>
                      <div className={`th-sort-wrapper ${roomSortField === 'status' ? 'active' : ''}`}>
                        <span>Status</span>
                        {renderRoomSortIndicator('status')}
                      </div>
                    </th>
                  )}
                  {isRoomColVisible('actions') && <th style={{ textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedRooms.map(r => {
                  const isSelected = selectedRoomIds.includes(r.id);
                  return (
                    <tr key={r.id} className={isSelected ? 'row-selected' : ''}>
                      {isRoomColVisible('select') && (
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            className="table-checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedRoomIds(prev =>
                                prev.includes(r.id) ? prev.filter(id => id !== r.id) : [...prev, r.id]
                              );
                            }}
                          />
                        </td>
                      )}
                      {isRoomColVisible('roomNumber') && (
                        <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.roomNumber}</td>
                      )}
                      {isRoomColVisible('block') && <td>{r.blockLabel}</td>}
                      {isRoomColVisible('floor') && <td>Floor {r.floor}</td>}
                      {isRoomColVisible('roomType') && <td>{r.roomType}</td>}
                      {isRoomColVisible('gender') && (
                        <td>
                          <span className={`badge ${r.gender === 'Boys' ? 'badge-info' : 'badge-danger'}`}>
                            {r.gender}
                          </span>
                        </td>
                      )}
                      {isRoomColVisible('beds') && (
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600 }}>
                              {r.occupiedBeds} / {r.totalBeds} beds
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                              ({Math.max(0, r.totalBeds - r.occupiedBeds)} vacant)
                            </span>
                          </div>
                        </td>
                      )}
                      {isRoomColVisible('status') && (
                        <td>
                          <select
                            className="table-quick-select"
                            value={r.status}
                            onChange={e => handleQuickRoomStatus(r.id, e.target.value as RoomStatus)}
                          >
                            <option value="available">Available</option>
                            <option value="full">Full</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </td>
                      )}
                      {isRoomColVisible('actions') && (
                        <td>
                          <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn-icon"
                              title="View room details"
                              onClick={() => setSelectedRoom(r)}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              title="Edit room specs"
                              onClick={() => openEditRoom(r)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-danger-icon"
                              title="Delete room"
                              onClick={() => setRoomToDelete(r)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {paginatedRooms.length === 0 && (
                  <tr>
                    <td
                      colSpan={roomColumns.filter(c => c.visible).length}
                      style={{ textAlign: 'center', padding: '36px', color: 'var(--clr-text-muted)' }}
                    >
                      No rooms found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={roomPage}
            totalItems={sortedRooms.length}
            pageSize={roomPageSize}
            onPageChange={setRoomPage}
            onPageSizeChange={setRoomPageSize}
          />
        </div>
      )}

      {/* ALLOCATIONS TABLE */}
      <div className="data-table-card" id="allocation">
        <div className="data-table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3>Resident Room Allocations</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
              ({sortedAllocs.length} records)
            </span>
          </div>

          <div className="table-controls">
            <select
              className="search-input"
              style={{ width: 130 }}
              value={allocStatusFilter}
              onChange={e => {
                setAllocStatusFilter(e.target.value);
                setAllocPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed / Vacated</option>
            </select>

            <input
              className="search-input"
              placeholder="Search student, room, ID…"
              value={allocSearch}
              onChange={e => {
                setAllocSearch(e.target.value);
                setAllocPage(1);
              }}
            />

            <ColumnVisibilityDropdown columns={allocColumns} onChange={setAllocColumns} />

            <button
              type="button"
              className="btn btn-outline-dark btn-sm"
              onClick={handleExportAllocs}
              title="Export allocations to CSV"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions for Allocations */}
        {selectedAllocIds.length > 0 && (
          <div style={{ padding: '0 20px', paddingTop: 14 }}>
            <BulkActionBar
              selectedCount={selectedAllocIds.length}
              totalCount={sortedAllocs.length}
              onClear={() => setSelectedAllocIds([])}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => {
                    selectedAllocIds.forEach(id => handleVacate(id));
                    setSelectedAllocIds([]);
                  }}
                >
                  Vacate Selected
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setShowBulkDeleteAllocConfirm(true)}
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
                {isAllocColVisible('select') && (
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="table-checkbox"
                      checked={sortedAllocs.length > 0 && selectedAllocIds.length === sortedAllocs.length}
                      onChange={e => {
                        if (e.target.checked) setSelectedAllocIds(sortedAllocs.map(a => a.id));
                        else setSelectedAllocIds([]);
                      }}
                    />
                  </th>
                )}
                {isAllocColVisible('allocationId') && (
                  <th className="sortable" onClick={() => handleAllocSort('allocationId')}>
                    <div className={`th-sort-wrapper ${allocSortField === 'allocationId' ? 'active' : ''}`}>
                      <span>Allocation ID</span>
                      {renderAllocSortIndicator('allocationId')}
                    </div>
                  </th>
                )}
                {isAllocColVisible('studentName') && (
                  <th className="sortable" onClick={() => handleAllocSort('studentName')}>
                    <div className={`th-sort-wrapper ${allocSortField === 'studentName' ? 'active' : ''}`}>
                      <span>Student</span>
                      {renderAllocSortIndicator('studentName')}
                    </div>
                  </th>
                )}
                {isAllocColVisible('roomNumber') && (
                  <th className="sortable" onClick={() => handleAllocSort('roomNumber')}>
                    <div className={`th-sort-wrapper ${allocSortField === 'roomNumber' ? 'active' : ''}`}>
                      <span>Room</span>
                      {renderAllocSortIndicator('roomNumber')}
                    </div>
                  </th>
                )}
                {isAllocColVisible('block') && <th>Block</th>}
                {isAllocColVisible('checkInDate') && (
                  <th className="sortable" onClick={() => handleAllocSort('checkInDate')}>
                    <div className={`th-sort-wrapper ${allocSortField === 'checkInDate' ? 'active' : ''}`}>
                      <span>Check-in</span>
                      {renderAllocSortIndicator('checkInDate')}
                    </div>
                  </th>
                )}
                {isAllocColVisible('checkOutDate') && <th>Check-out</th>}
                {isAllocColVisible('status') && (
                  <th className="sortable" onClick={() => handleAllocSort('status')}>
                    <div className={`th-sort-wrapper ${allocSortField === 'status' ? 'active' : ''}`}>
                      <span>Status</span>
                      {renderAllocSortIndicator('status')}
                    </div>
                  </th>
                )}
                {isAllocColVisible('actions') && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedAllocs.map(a => {
                const isSelected = selectedAllocIds.includes(a.id);
                return (
                  <tr key={a.id} className={isSelected ? 'row-selected' : ''}>
                    {isAllocColVisible('select') && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedAllocIds(prev =>
                              prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id]
                            );
                          }}
                        />
                      </td>
                    )}
                    {isAllocColVisible('allocationId') && (
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{a.allocationId}</td>
                    )}
                    {isAllocColVisible('studentName') && (
                      <td style={{ fontWeight: 600 }}>{a.studentName}</td>
                    )}
                    {isAllocColVisible('roomNumber') && (
                      <td>
                        <span style={{ fontWeight: 600 }}>{a.roomNumber}</span>
                      </td>
                    )}
                    {isAllocColVisible('block') && <td>{a.block}</td>}
                    {isAllocColVisible('checkInDate') && <td>{a.checkInDate}</td>}
                    {isAllocColVisible('checkOutDate') && <td>{a.checkOutDate || '—'}</td>}
                    {isAllocColVisible('status') && (
                      <td>
                        <Badge variant={a.status === 'active' ? 'active' : 'vacant'}>
                          {a.status === 'active' ? 'Active Resident' : 'Vacated'}
                        </Badge>
                      </td>
                    )}
                    {isAllocColVisible('actions') && (
                      <td>
                        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                          {a.status === 'active' && (
                            <button
                              type="button"
                              className="btn btn-outline-dark btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                              onClick={() => handleVacate(a.id)}
                            >
                              Vacate
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-icon"
                            title="Edit allocation"
                            onClick={() => openEditAlloc(a)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-danger-icon"
                            title="Delete allocation record"
                            onClick={() => setAllocToDelete(a)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {paginatedAllocs.length === 0 && (
                <tr>
                  <td
                    colSpan={allocColumns.filter(c => c.visible).length}
                    style={{ textAlign: 'center', padding: '32px', color: 'var(--clr-text-muted)' }}
                  >
                    No allocations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={allocPage}
          totalItems={sortedAllocs.length}
          pageSize={allocPageSize}
          onPageChange={setAllocPage}
          onPageSizeChange={setAllocPageSize}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>

      {/* ROOM DETAIL MODAL */}
      {selectedRoom && (
        <Modal isOpen={!!selectedRoom} onClose={() => setSelectedRoom(null)} title={`Room ${selectedRoom.roomNumber}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { l: 'Block', v: selectedRoom.blockLabel },
                { l: 'Floor', v: `Floor ${selectedRoom.floor}` },
                { l: 'Room Type', v: selectedRoom.roomType },
                { l: 'Gender Host', v: selectedRoom.gender },
                { l: 'Total Beds', v: selectedRoom.totalBeds },
                { l: 'Occupied Beds', v: selectedRoom.occupiedBeds },
                { l: 'Vacant Beds', v: Math.max(0, selectedRoom.totalBeds - selectedRoom.occupiedBeds) },
                { l: 'Current Status', v: selectedRoom.status.charAt(0).toUpperCase() + selectedRoom.status.slice(1) },
              ].map(item => (
                <div key={item.l} style={{ padding: 12, background: 'var(--clr-bg)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '.72rem', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>
                    {item.l}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{item.v}</div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => {
                  const target = selectedRoom;
                  setSelectedRoom(null);
                  openEditRoom(target);
                }}
              >
                <Edit2 size={13} />
                <span>Edit Room</span>
              </button>
              {selectedRoom.status !== 'full' && selectedRoom.status !== 'maintenance' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const roomOption = `${selectedRoom.roomNumber} — ${selectedRoom.blockLabel}`;
                    setSelectedRoom(null);
                    setAllocForm(f => ({ ...f, roomId: roomOption }));
                    setShowAllocModal(true);
                  }}
                >
                  Allocate Student
                </button>
              )}
              <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => setSelectedRoom(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ALLOCATE MODAL */}
      <Modal isOpen={showAllocModal} onClose={() => setShowAllocModal(false)} title="Allocate Resident to Room">
        <form onSubmit={handleAllocate}>
          <div className="form-group">
            <label>Search Resident Student *</label>
            <input
              className="form-input"
              list="student-list"
              value={allocForm.studentId}
              onChange={e => setAllocForm(f => ({ ...f, studentId: e.target.value }))}
              placeholder="Search by student name or ID..."
              required
            />
            <datalist id="student-list">
              {unassignedStudents.map(s => (
                <option key={s.id} value={`${s.firstName} ${s.lastName} (${s.studentId})`} />
              ))}
            </datalist>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Select Available Room *</label>
              <input
                className="form-input"
                list="room-list"
                value={allocForm.roomId}
                onChange={e => setAllocForm(f => ({ ...f, roomId: e.target.value }))}
                placeholder="Search room number..."
                required
              />
              <datalist id="room-list">
                {availableRooms.map(r => (
                  <option key={r.id} value={`${r.roomNumber} — ${r.blockLabel}`}>
                    {r.totalBeds - r.occupiedBeds} bed(s) available
                  </option>
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label>Check-in Date *</label>
              <input
                className="form-input"
                type="date"
                value={allocForm.checkInDate}
                onChange={e => setAllocForm(f => ({ ...f, checkInDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="info-box">
            System automatically validates capacity and updates the room bed counter.
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-dark" onClick={() => setShowAllocModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Allocation ✓
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD ROOM MODAL */}
      <Modal isOpen={showAddRoomModal} onClose={() => setShowAddRoomModal(false)} title="Add New Room">
        <form onSubmit={handleAddRoom}>
          <div className="form-row">
            <div className="form-group">
              <label>Hostel Block *</label>
              <select
                className="form-select"
                value={roomForm.block}
                onChange={e => setRoomForm(f => ({ ...f, block: e.target.value as Room['block'] }))}
                required
              >
                <option value="A">Block A (Boys)</option>
                <option value="B">Block B (Boys)</option>
                <option value="C">Block C (Girls)</option>
                <option value="D">Block D (Girls)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Room Number *</label>
              <input
                className="form-input"
                value={roomForm.roomNumber}
                onChange={e => setRoomForm(f => ({ ...f, roomNumber: e.target.value }))}
                placeholder="e.g. A-401"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Floor *</label>
              <input
                className="form-input"
                type="number"
                min={1}
                max={15}
                value={roomForm.floor}
                onChange={e => setRoomForm(f => ({ ...f, floor: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Total Beds *</label>
              <select
                className="form-select"
                value={roomForm.totalBeds}
                onChange={e => setRoomForm(f => ({ ...f, totalBeds: Number(e.target.value) }))}
                required
              >
                <option value={1}>1 Bed (Single)</option>
                <option value={2}>2 Beds (Double)</option>
                <option value={3}>3 Beds (Triple)</option>
                <option value={4}>4 Beds (Quad / Dorm)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Room Type</label>
              <select
                className="form-select"
                value={roomForm.roomType}
                onChange={e => setRoomForm(f => ({ ...f, roomType: e.target.value as Room['roomType'] }))}
              >
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Triple">Triple</option>
                <option value="Dormitory">Dormitory</option>
              </select>
            </div>
            <div className="form-group">
              <label>Hostel Gender</label>
              <select
                className="form-select"
                value={roomForm.gender}
                onChange={e => setRoomForm(f => ({ ...f, gender: e.target.value as Room['gender'] }))}
              >
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-dark" onClick={() => setShowAddRoomModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Room to Inventory ✓
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT ROOM MODAL */}
      {editingRoom && (
        <Modal isOpen={!!editingRoom} onClose={() => setEditingRoom(null)} title={`Edit Room ${editingRoom.roomNumber}`}>
          <form onSubmit={handleEditRoomSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Room Number *</label>
                <input
                  className="form-input"
                  value={roomForm.roomNumber}
                  onChange={e => setRoomForm(f => ({ ...f, roomNumber: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Hostel Block *</label>
                <select
                  className="form-select"
                  value={roomForm.block}
                  onChange={e => setRoomForm(f => ({ ...f, block: e.target.value as Room['block'] }))}
                >
                  <option value="A">Block A</option>
                  <option value="B">Block B</option>
                  <option value="C">Block C</option>
                  <option value="D">Block D</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Floor *</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={15}
                  value={roomForm.floor}
                  onChange={e => setRoomForm(f => ({ ...f, floor: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Total Beds *</label>
                <select
                  className="form-select"
                  value={roomForm.totalBeds}
                  onChange={e => setRoomForm(f => ({ ...f, totalBeds: Number(e.target.value) }))}
                >
                  <option value={1}>1 Bed</option>
                  <option value={2}>2 Beds</option>
                  <option value={3}>3 Beds</option>
                  <option value={4}>4 Beds</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Room Type</label>
                <select
                  className="form-select"
                  value={roomForm.roomType}
                  onChange={e => setRoomForm(f => ({ ...f, roomType: e.target.value as Room['roomType'] }))}
                >
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Triple">Triple</option>
                  <option value="Dormitory">Dormitory</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-select"
                  value={roomForm.status}
                  onChange={e => setRoomForm(f => ({ ...f, status: e.target.value as RoomStatus }))}
                >
                  <option value="available">Available</option>
                  <option value="full">Full</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark" onClick={() => setEditingRoom(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Room Specs ✓
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT ALLOCATION MODAL */}
      {editingAlloc && (
        <Modal
          isOpen={!!editingAlloc}
          onClose={() => setEditingAlloc(null)}
          title={`Edit Allocation — ${editingAlloc.allocationId}`}
        >
          <form onSubmit={handleEditAllocSubmit}>
            <div className="form-group">
              <label>Student Name</label>
              <input
                className="form-input"
                value={editingAlloc.studentName}
                onChange={e => setEditingAlloc(a => (a ? { ...a, studentName: e.target.value } : null))}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Room Number</label>
                <input
                  className="form-input"
                  value={editingAlloc.roomNumber}
                  onChange={e => setEditingAlloc(a => (a ? { ...a, roomNumber: e.target.value } : null))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Block</label>
                <input
                  className="form-input"
                  value={editingAlloc.block}
                  onChange={e => setEditingAlloc(a => (a ? { ...a, block: e.target.value } : null))}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Check-in Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={editingAlloc.checkInDate}
                  onChange={e => setEditingAlloc(a => (a ? { ...a, checkInDate: e.target.value } : null))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-select"
                  value={editingAlloc.status}
                  onChange={e =>
                    setEditingAlloc(a =>
                      a ? { ...a, status: e.target.value as Allocation['status'] } : null
                    )
                  }
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed / Vacated</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark" onClick={() => setEditingAlloc(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Update Allocation ✓
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRM DELETE MODALS */}
      {roomToDelete && (
        <ConfirmModal
          isOpen={!!roomToDelete}
          onClose={() => setRoomToDelete(null)}
          onConfirm={handleDeleteRoomConfirm}
          title="Delete Room"
          message={`Are you sure you want to permanently delete Room "${roomToDelete.roomNumber}" from ${roomToDelete.blockLabel}?`}
          confirmText="Yes, Delete Room"
          danger
        />
      )}

      <ConfirmModal
        isOpen={showBulkDeleteRoomsConfirm}
        onClose={() => setShowBulkDeleteRoomsConfirm(false)}
        onConfirm={handleBulkDeleteRooms}
        title="Delete Selected Rooms"
        message={`Are you sure you want to delete all ${selectedRoomIds.length} selected rooms?`}
        confirmText={`Delete ${selectedRoomIds.length} Rooms`}
        danger
      />

      {allocToDelete && (
        <ConfirmModal
          isOpen={!!allocToDelete}
          onClose={() => setAllocToDelete(null)}
          onConfirm={handleDeleteAllocConfirm}
          title="Delete Allocation Record"
          message={`Are you sure you want to permanently delete allocation "${allocToDelete.allocationId}" for ${allocToDelete.studentName}?`}
          confirmText="Delete Record"
          danger
        />
      )}

      <ConfirmModal
        isOpen={showBulkDeleteAllocConfirm}
        onClose={() => setShowBulkDeleteAllocConfirm(false)}
        onConfirm={handleBulkDeleteAlloc}
        title="Delete Selected Allocations"
        message={`Are you sure you want to delete ${selectedAllocIds.length} allocation records?`}
        confirmText={`Delete ${selectedAllocIds.length} Allocations`}
        danger
      />

      {/* ROOMS TABLE ACTIVITY HISTORY MODAL */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        moduleName="rooms"
        title="Rooms & Allocations Action History"
      />
    </PageLayout>
  );
};

export default Rooms;
