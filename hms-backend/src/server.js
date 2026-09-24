/**
 * Web-Based Hostel Management System (HMS) - Backend API Server
 * Node.js + Express.js
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// In-Memory Seed Data (with PostgreSQL ready data structure)
let students = [
  { id: '1', name: 'Aarav Sharma', rollNumber: 'MCA202401', course: 'MCA - Year 1', roomNumber: 'B1-102', phone: '+91 98765 43210', email: 'aarav.sharma@hostel.edu', feeStatus: 'Paid', status: 'Active', joinDate: '2024-08-01' },
  { id: '2', name: 'Rohan Verma', rollNumber: 'MCA202402', course: 'MCA - Year 1', roomNumber: 'B1-102', phone: '+91 98765 43211', email: 'rohan.verma@hostel.edu', feeStatus: 'Pending', status: 'Active', joinDate: '2024-08-01' },
  { id: '3', name: 'Sneha Patel', rollNumber: 'MCA202403', course: 'MCA - Year 2', roomNumber: 'G1-201', phone: '+91 98765 43212', email: 'sneha.patel@hostel.edu', feeStatus: 'Paid', status: 'Active', joinDate: '2023-08-15' },
  { id: '4', name: 'Vikram Singh', rollNumber: 'MCA202404', course: 'MCA - Year 1', roomNumber: 'B2-305', phone: '+91 98765 43213', email: 'vikram.singh@hostel.edu', feeStatus: 'Overdue', status: 'Active', joinDate: '2024-08-01' },
  { id: '5', name: 'Pooja Iyer', rollNumber: 'MCA202405', course: 'MCA - Year 2', roomNumber: 'G1-204', phone: '+91 98765 43214', email: 'pooja.iyer@hostel.edu', feeStatus: 'Paid', status: 'Active', joinDate: '2023-08-15' },
  { id: '6', name: 'Aditya Kulkarni', rollNumber: 'MCA202406', course: 'MCA - Year 1', roomNumber: 'B1-104', phone: '+91 98765 43215', email: 'aditya.k@hostel.edu', feeStatus: 'Paid', status: 'Active', joinDate: '2024-08-01' },
  { id: '7', name: 'Ananya Roy', rollNumber: 'MCA202407', course: 'MCA - Year 2', roomNumber: 'G2-101', phone: '+91 98765 43216', email: 'ananya.roy@hostel.edu', feeStatus: 'Pending', status: 'Active', joinDate: '2023-08-15' },
  { id: '8', name: 'Karan Mehra', rollNumber: 'MCA202408', course: 'MCA - Year 1', roomNumber: 'B2-308', phone: '+91 98765 43217', email: 'karan.m@hostel.edu', feeStatus: 'Paid', status: 'Active', joinDate: '2024-08-01' }
];

let rooms = [
  { id: 'r1', roomNumber: 'B1-101', block: 'Block A (Boys)', floor: 1, type: 'Single', capacity: 1, occupiedBeds: 1, status: 'Full', monthlyRent: 8500, amenities: ['AC', 'Wi-Fi', 'Attached Bath', 'Study Desk'] },
  { id: 'r2', roomNumber: 'B1-102', block: 'Block A (Boys)', floor: 1, type: 'Double', capacity: 2, occupiedBeds: 2, status: 'Full', monthlyRent: 6000, amenities: ['Wi-Fi', 'Balcony', 'Study Desk'] },
  { id: 'r3', roomNumber: 'B1-103', block: 'Block A (Boys)', floor: 1, type: 'Double', capacity: 2, occupiedBeds: 1, status: 'Available', monthlyRent: 6000, amenities: ['Wi-Fi', 'Attached Bath'] },
  { id: 'r4', roomNumber: 'B1-104', block: 'Block A (Boys)', floor: 1, type: 'Triple', capacity: 3, occupiedBeds: 1, status: 'Available', monthlyRent: 4500, amenities: ['Wi-Fi', 'Common Bath'] },
  { id: 'r5', roomNumber: 'B2-201', block: 'Block B (Boys)', floor: 2, type: 'Single', capacity: 1, occupiedBeds: 0, status: 'Available', monthlyRent: 9000, amenities: ['AC', 'Wi-Fi', 'Attached Bath'] },
  { id: 'r6', roomNumber: 'B2-202', block: 'Block B (Boys)', floor: 2, type: 'Double', capacity: 2, occupiedBeds: 0, status: 'Maintenance', monthlyRent: 6000, amenities: ['Wi-Fi', 'Balcony'] },
  { id: 'r7', roomNumber: 'G1-101', block: 'Block C (Girls)', floor: 1, type: 'Single', capacity: 1, occupiedBeds: 1, status: 'Full', monthlyRent: 8500, amenities: ['AC', 'Wi-Fi', 'Attached Bath'] },
  { id: 'r8', roomNumber: 'G1-102', block: 'Block C (Girls)', floor: 1, type: 'Double', capacity: 2, occupiedBeds: 1, status: 'Available', monthlyRent: 6000, amenities: ['Wi-Fi', 'Attached Bath'] }
];

let feeRecords = [
  { id: 'f1', studentId: '1', studentName: 'Aarav Sharma', rollNumber: 'MCA202401', roomNumber: 'B1-102', amount: 36000, semester: 'Semester 1 (2024)', dueDate: '2024-08-10', paidDate: '2024-08-05', status: 'Paid', paymentMethod: 'UPI' },
  { id: 'f2', studentId: '2', studentName: 'Rohan Verma', rollNumber: 'MCA202402', roomNumber: 'B1-102', amount: 36000, semester: 'Semester 1 (2024)', dueDate: '2024-09-15', status: 'Pending' },
  { id: 'f3', studentId: '3', studentName: 'Sneha Patel', rollNumber: 'MCA202403', roomNumber: 'G1-201', amount: 42000, semester: 'Semester 3 (2024)', dueDate: '2024-08-10', paidDate: '2024-08-08', status: 'Paid', paymentMethod: 'Bank Transfer' },
  { id: 'f4', studentId: '4', studentName: 'Vikram Singh', rollNumber: 'MCA202404', roomNumber: 'B2-305', amount: 36000, semester: 'Semester 1 (2024)', dueDate: '2024-08-01', status: 'Overdue' }
];

let complaints = [
  { id: 'c1', studentId: '1', studentName: 'Aarav Sharma', roomNumber: 'B1-102', category: 'Plumbing', title: 'Leaking tap in attached bathroom', description: 'The washbasin tap has been continuously dripping since yesterday morning.', priority: 'Medium', status: 'In Progress', createdAt: '2024-09-18 09:30' },
  { id: 'c2', studentId: '4', studentName: 'Vikram Singh', roomNumber: 'B2-305', category: 'Electrical', title: 'Ceiling fan making loud noise', description: 'Regulator seems broken, fan runs at max speed with clicking sound.', priority: 'High', status: 'Pending', createdAt: '2024-09-19 14:15' },
  { id: 'c3', studentId: '3', studentName: 'Sneha Patel', roomNumber: 'G1-201', category: 'Wi-Fi / Internet', title: 'Weak Wi-Fi signal on 2nd floor west wing', description: 'Router reboots repeatedly during evening study hours.', priority: 'Medium', status: 'Resolved', createdAt: '2024-09-15 11:00', resolvedAt: '2024-09-16 16:45' }
];

let visitors = [
  { id: 'v1', visitorName: 'Sunil Sharma', studentId: '1', studentName: 'Aarav Sharma', relation: 'Father', phone: '+91 94250 11223', idProof: 'Aadhar 4432-xxxx-9812', checkIn: '2024-09-20 10:30', checkOut: '2024-09-20 12:45', status: 'Checked Out' },
  { id: 'v2', visitorName: 'Kavita Verma', studentId: '2', studentName: 'Rohan Verma', relation: 'Mother', phone: '+91 94250 99887', idProof: 'PAN Card ABCPVxxxxD', checkIn: '2024-09-20 14:15', status: 'Currently Inside' }
];

let notices = [
  { id: 'n1', title: 'Hostel Maintenance & Water Tank Cleaning', content: 'Water supply will be suspended on Saturday, 23rd Sept between 10:00 AM and 02:00 PM for deep cleaning.', date: '2024-09-18', author: 'Chief Warden', category: 'Maintenance', priority: 'High', isPinned: true },
  { id: 'n2', title: 'Semester 1 Fee Clearance Deadline', content: 'All residents are advised to clear pending mess and room dues before 30th Sept to avoid late fee penalties.', date: '2024-09-15', author: 'Accounts Dept', category: 'Finance', priority: 'High', isPinned: true },
  { id: 'n3', title: 'Gymnasium & Indoor Sports Room New Timings', content: 'The recreation center will now remain open from 06:00 AM - 09:00 AM and 05:00 PM - 10:00 PM daily.', date: '2024-09-10', author: 'Sports Committee', category: 'General', priority: 'Low', isPinned: false }
];

// --- ROUTES ---

// Health & Info Check
app.get('/', (req, res) => {
  res.json({
    message: 'Hostel Management System (HMS) REST API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/login',
      dashboard: '/api/dashboard/stats',
      students: '/api/students',
      rooms: '/api/rooms',
      fees: '/api/fees',
      complaints: '/api/complaints',
      visitors: '/api/visitors',
      notices: '/api/notices'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  // Admin login check
  if (username.toLowerCase() === 'admin' || username.toLowerCase() === 'admin@hostel.edu') {
    if (password === 'admin123') {
      return res.json({
        token: 'jwt-mock-admin-token-' + Date.now(),
        user: {
          id: 'adm-1',
          name: 'Dr. Sarah Jenkins',
          role: 'admin',
          email: 'admin@hostel.edu',
          hostelName: 'Oakridge International Campus Hostel'
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
  }

  // Student login check
  if (username.toLowerCase() === 'student' || username.toUpperCase() === 'MCA202401' || username.toLowerCase() === 'aarav.sharma@hostel.edu') {
    if (password === 'stu123' || password === 'student123') {
      return res.json({
        token: 'jwt-mock-student-token-' + Date.now(),
        user: {
          id: '1',
          name: 'Aarav Sharma',
          role: 'student',
          email: 'aarav.sharma@hostel.edu',
          rollNumber: 'MCA202401',
          roomNumber: 'B1-102'
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid student credentials' });
    }
  }

  return res.status(401).json({ error: 'Invalid credentials. User not found.' });
});

// Dashboard Metrics
app.get('/api/dashboard/stats', (req, res) => {
  const totalBeds = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.occupiedBeds, 0);
  const pendingFeesCount = feeRecords.filter(f => f.status === 'Pending' || f.status === 'Overdue').length;
  const activeComplaintsCount = complaints.filter(c => c.status !== 'Resolved').length;
  const insideVisitorsCount = visitors.filter(v => v.status === 'Currently Inside').length;

  res.json({
    kpis: {
      totalStudents: students.length,
      totalRooms: rooms.length,
      occupancyRate: Math.round((occupiedBeds / totalBeds) * 100),
      occupiedBeds,
      totalBeds,
      pendingFeesCount,
      activeComplaintsCount,
      visitorsToday: visitors.length,
      visitorsInside: insideVisitorsCount
    },
    occupancyByBlock: [
      { name: 'Block A (Boys)', occupied: 4, available: 2, total: 6 },
      { name: 'Block B (Boys)', occupied: 0, available: 3, total: 3 },
      { name: 'Block C (Girls)', occupied: 2, available: 1, total: 3 }
    ],
    roomTypeDistribution: [
      { name: 'Single Bed', count: 3 },
      { name: 'Double Bed', count: 4 },
      { name: 'Triple Bed', count: 1 }
    ]
  });
});

// Students CRUD
app.get('/api/students', (req, res) => {
  let result = [...students];
  const { search, status, feeStatus } = req.query;

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.roomNumber.toLowerCase().includes(q)
    );
  }
  if (status) {
    result = result.filter(s => s.status === status);
  }
  if (feeStatus) {
    result = result.filter(s => s.feeStatus === feeStatus);
  }

  res.json(result);
});

app.post('/api/students', (req, res) => {
  const { name, rollNumber, course, roomNumber, phone, email } = req.body;
  if (!name || !rollNumber) {
    return res.status(400).json({ error: 'Name and Roll Number are required' });
  }

  const newStudent = {
    id: 's-' + Date.now(),
    name,
    rollNumber,
    course: course || 'MCA - Year 1',
    roomNumber: roomNumber || 'Unassigned',
    phone: phone || '',
    email: email || `${rollNumber.toLowerCase()}@hostel.edu`,
    feeStatus: 'Pending',
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0]
  };

  students.push(newStudent);
  res.status(201).json(newStudent);
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = students.length;
  students = students.filter(s => s.id !== id);
  if (students.length === initialLen) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json({ message: 'Student deleted successfully', id });
});

// Rooms CRUD & Allocation
app.get('/api/rooms', (req, res) => {
  let result = [...rooms];
  const { status, type, block } = req.query;
  if (status) result = result.filter(r => r.status === status);
  if (type) result = result.filter(r => r.type === type);
  if (block) result = result.filter(r => r.block === block);
  res.json(result);
});

app.post('/api/rooms/allocate', (req, res) => {
  const { roomId, studentId } = req.body;
  const room = rooms.find(r => r.id === roomId);
  const student = students.find(s => s.id === studentId);

  if (!room || !student) {
    return res.status(404).json({ error: 'Room or Student not found' });
  }

  if (room.occupiedBeds >= room.capacity) {
    return res.status(400).json({ error: 'Room is at maximum capacity' });
  }

  room.occupiedBeds += 1;
  if (room.occupiedBeds === room.capacity) {
    room.status = 'Full';
  }
  student.roomNumber = room.roomNumber;

  res.json({ message: 'Room allocated successfully', room, student });
});

// Fees CRUD
app.get('/api/fees', (req, res) => {
  res.json(feeRecords);
});

app.post('/api/fees/pay', (req, res) => {
  const { feeId, paymentMethod } = req.body;
  const record = feeRecords.find(f => f.id === feeId);
  if (!record) {
    return res.status(404).json({ error: 'Fee invoice not found' });
  }

  record.status = 'Paid';
  record.paidDate = new Date().toISOString().split('T')[0];
  record.paymentMethod = paymentMethod || 'UPI';

  // Also update student status
  const student = students.find(s => s.id === record.studentId);
  if (student) student.feeStatus = 'Paid';

  res.json({ message: 'Payment recorded successfully', record });
});

// Complaints CRUD
app.get('/api/complaints', (req, res) => {
  res.json(complaints);
});

app.post('/api/complaints', (req, res) => {
  const { studentName, roomNumber, category, title, description, priority } = req.body;
  const newComplaint = {
    id: 'c-' + Date.now(),
    studentId: '1',
    studentName: studentName || 'Aarav Sharma',
    roomNumber: roomNumber || 'B1-102',
    category: category || 'General',
    title,
    description,
    priority: priority || 'Medium',
    status: 'Pending',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };
  complaints.unshift(newComplaint);
  res.status(201).json(newComplaint);
});

app.patch('/api/complaints/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  complaint.status = status;
  if (status === 'Resolved') {
    complaint.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
  }
  res.json(complaint);
});

// Visitors CRUD
app.get('/api/visitors', (req, res) => {
  res.json(visitors);
});

app.post('/api/visitors/checkin', (req, res) => {
  const { visitorName, studentName, relation, phone, idProof } = req.body;
  const newVisitor = {
    id: 'v-' + Date.now(),
    visitorName,
    studentId: '1',
    studentName: studentName || 'Aarav Sharma',
    relation,
    phone,
    idProof,
    checkIn: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'Currently Inside'
  };
  visitors.unshift(newVisitor);
  res.status(201).json(newVisitor);
});

app.post('/api/visitors/:id/checkout', (req, res) => {
  const { id } = req.params;
  const visitor = visitors.find(v => v.id === id);
  if (!visitor) {
    return res.status(404).json({ error: 'Visitor record not found' });
  }
  visitor.status = 'Checked Out';
  visitor.checkOut = new Date().toISOString().replace('T', ' ').substring(0, 16);
  res.json(visitor);
});

// Notices CRUD
app.get('/api/notices', (req, res) => {
  res.json(notices);
});

app.post('/api/notices', (req, res) => {
  const { title, content, category, priority, isPinned } = req.body;
  const newNotice = {
    id: 'n-' + Date.now(),
    title,
    content,
    category: category || 'General',
    priority: priority || 'Medium',
    isPinned: !!isPinned,
    author: 'Warden Office',
    date: new Date().toISOString().split('T')[0]
  };
  notices.unshift(newNotice);
  res.status(201).json(newNotice);
});

app.delete('/api/notices/:id', (req, res) => {
  const { id } = req.params;
  notices = notices.filter(n => n.id !== id);
  res.json({ message: 'Notice deleted', id });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 HMS Backend API Server running at: http://localhost:${PORT}`);
  console.log(`📁 Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
