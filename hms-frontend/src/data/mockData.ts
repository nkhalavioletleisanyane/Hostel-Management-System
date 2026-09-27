// ============================================================
// HMS – Mock Data (typed, realistic)
// ============================================================
import type {
  Student, Room, Allocation, FeeInvoice,
  Complaint, Visitor, Notice, DashboardStats, BlockOccupancy
} from '../types';

export const mockStudents: Student[] = [
  { id:'s1', studentId:'STU-2024-001', firstName:'Amit', lastName:'Rathore', email:'amit.r@hms.edu', phone:'9876543210', course:'MCA', semester:'Sem 3', roomId:'r1', roomNumber:'A-101', blockName:'Block A', checkInDate:'2024-08-01', emergencyContact:'Suresh Rathore', emergencyPhone:'9876500001', status:'active', avatar:'AR' },
  { id:'s2', studentId:'STU-2024-002', firstName:'Priya', lastName:'Kumar', email:'priya.k@hms.edu', phone:'9123456780', course:'MCA', semester:'Sem 1', roomId:'r5', roomNumber:'C-205', blockName:'Block C', checkInDate:'2024-08-03', emergencyContact:'Ramesh Kumar', emergencyPhone:'9100200300', status:'active', avatar:'PK' },
  { id:'s3', studentId:'STU-2024-003', firstName:'Rahul', lastName:'Sharma', email:'rahul.s@hms.edu', phone:'9988776655', course:'MCA', semester:'Sem 5', roomId:'r3', roomNumber:'B-310', blockName:'Block B', checkInDate:'2024-08-05', emergencyContact:'Meena Sharma', emergencyPhone:'9100200301', status:'fee-due', avatar:'RS' },
  { id:'s4', studentId:'STU-2024-004', firstName:'Sneha', lastName:'Mehta', email:'sneha.m@hms.edu', phone:'8877665544', course:'MCA', semester:'Sem 3', roomId:'r7', roomNumber:'D-112', blockName:'Block D', checkInDate:'2024-08-05', emergencyContact:'Girish Mehta', emergencyPhone:'9922334401', status:'active', avatar:'SM' },
  { id:'s5', studentId:'STU-2024-005', firstName:'Vikram', lastName:'Gupta', email:'vikram.g@hms.edu', phone:'7766554433', course:'MCA', semester:'Sem 1', emergencyContact:'Pooja Gupta', emergencyPhone:'9777665500', status:'unassigned', avatar:'VG' },
  { id:'s6', studentId:'STU-2024-006', firstName:'Kavya', lastName:'Nair', email:'kavya.n@hms.edu', phone:'9345678901', course:'MCA', semester:'Sem 5', roomId:'r2', roomNumber:'A-202', blockName:'Block A', checkInDate:'2026-09-12', emergencyContact:'Deepak Nair', emergencyPhone:'9988765432', status:'fee-due', avatar:'KN' },
  { id:'s7', studentId:'STU-2024-007', firstName:'Arjun', lastName:'Singh', email:'arjun.s@hms.edu', phone:'9001122334', course:'MCA', semester:'Sem 3', roomId:'r9', roomNumber:'B-201', blockName:'Block B', checkInDate:'2024-08-07', emergencyContact:'Harbhajan Singh', emergencyPhone:'9001100000', status:'active', avatar:'AS' },
  { id:'s8', studentId:'STU-2024-008', firstName:'Divya', lastName:'Patel', email:'divya.p@hms.edu', phone:'9876001122', course:'MCA', semester:'Sem 1', roomId:'r11', roomNumber:'D-301', blockName:'Block D', checkInDate:'2024-08-09', emergencyContact:'Ravi Patel', emergencyPhone:'9876000099', status:'active', avatar:'DP' },
];

export const mockRooms: Room[] = [
  { id:'r1',  roomNumber:'A-101', block:'A', blockLabel:'Block A (Boys)', floor:1, totalBeds:2, occupiedBeds:2, roomType:'Double', status:'full',      gender:'Boys' },
  { id:'r2',  roomNumber:'A-202', block:'A', blockLabel:'Block A (Boys)', floor:2, totalBeds:2, occupiedBeds:2, roomType:'Double', status:'full',      gender:'Boys' },
  { id:'r3',  roomNumber:'A-103', block:'A', blockLabel:'Block A (Boys)', floor:1, totalBeds:2, occupiedBeds:1, roomType:'Double', status:'available', gender:'Boys' },
  { id:'r4',  roomNumber:'A-204', block:'A', blockLabel:'Block A (Boys)', floor:2, totalBeds:2, occupiedBeds:0, roomType:'Double', status:'available', gender:'Boys' },
  { id:'r5',  roomNumber:'B-101', block:'B', blockLabel:'Block B (Boys)', floor:1, totalBeds:2, occupiedBeds:2, roomType:'Double', status:'full',      gender:'Boys' },
  { id:'r6',  roomNumber:'B-201', block:'B', blockLabel:'Block B (Boys)', floor:2, totalBeds:2, occupiedBeds:1, roomType:'Double', status:'available', gender:'Boys' },
  { id:'r7',  roomNumber:'B-310', block:'B', blockLabel:'Block B (Boys)', floor:3, totalBeds:2, occupiedBeds:2, roomType:'Double', status:'full',      gender:'Boys' },
  { id:'r8',  roomNumber:'B-311', block:'B', blockLabel:'Block B (Boys)', floor:3, totalBeds:2, occupiedBeds:0, roomType:'Double', status:'available', gender:'Boys' },
  { id:'r9',  roomNumber:'C-101', block:'C', blockLabel:'Block C (Girls)', floor:1, totalBeds:2, occupiedBeds:2, roomType:'Double', status:'full',      gender:'Girls' },
  { id:'r10', roomNumber:'C-205', block:'C', blockLabel:'Block C (Girls)', floor:2, totalBeds:2, occupiedBeds:2, roomType:'Double', status:'full',      gender:'Girls' },
  { id:'r11', roomNumber:'C-207', block:'C', blockLabel:'Block C (Girls)', floor:2, totalBeds:2, occupiedBeds:0, roomType:'Double', status:'available', gender:'Girls' },
  { id:'r12', roomNumber:'D-112', block:'D', blockLabel:'Block D (Girls)', floor:1, totalBeds:2, occupiedBeds:2, roomType:'Double', status:'full',      gender:'Girls' },
  { id:'r13', roomNumber:'D-202', block:'D', blockLabel:'Block D (Girls)', floor:2, totalBeds:2, occupiedBeds:0, roomType:'Double', status:'available', gender:'Girls' },
  { id:'r14', roomNumber:'D-301', block:'D', blockLabel:'Block D (Girls)', floor:3, totalBeds:2, occupiedBeds:2, roomType:'Double', status:'full',      gender:'Girls' },
  { id:'r15', roomNumber:'A-301', block:'A', blockLabel:'Block A (Boys)', floor:3, totalBeds:2, occupiedBeds:1, roomType:'Double', status:'available', gender:'Boys' },
  { id:'r16', roomNumber:'B-402', block:'B', blockLabel:'Block B (Boys)', floor:4, totalBeds:2, occupiedBeds:0, roomType:'Double', status:'maintenance', gender:'Boys' },
];

export const mockAllocations: Allocation[] = [
  { id:'al1', allocationId:'ALLOC-001', studentId:'s1', studentName:'Amit Rathore',   roomId:'r1',  roomNumber:'A-101', block:'Block A', checkInDate:'2024-08-01', status:'active' },
  { id:'al2', allocationId:'ALLOC-002', studentId:'s2', studentName:'Priya Kumar',    roomId:'r10', roomNumber:'C-205', block:'Block C', checkInDate:'2024-08-03', status:'active' },
  { id:'al3', allocationId:'ALLOC-003', studentId:'s3', studentName:'Rahul Sharma',   roomId:'r7',  roomNumber:'B-310', block:'Block B', checkInDate:'2024-08-05', status:'active' },
  { id:'al4', allocationId:'ALLOC-004', studentId:'s4', studentName:'Sneha Mehta',    roomId:'r12', roomNumber:'D-112', block:'Block D', checkInDate:'2024-08-05', status:'active' },
  { id:'al5', allocationId:'ALLOC-005', studentId:'s6', studentName:'Kavya Nair',     roomId:'r2',  roomNumber:'A-202', block:'Block A', checkInDate:'2026-09-12', status:'active' },
];

export const mockFees: FeeInvoice[] = [
  {
    id:'f1',
    invoiceNo:'INV-2024-001',
    studentId:'s99',
    studentName:'Pooja Verma',
    category:'Hostel Sem Fee',
    amount:12000,
    issueDate:'2024-08-01',
    dueDate:'2024-08-15',
    paidDate:'2024-08-10',
    paidAmount:12000,
    paymentMode:'UPI',
    transactionRef:'UTR123456',
    status:'paid',
    receiptDocument: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="70" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="%230f172a">OFFICIAL PAYMENT RECEIPT / PROOF</text><text x="40" y="110" font-family="Arial, sans-serif" font-size="14" fill="%2364748b">Transaction Ref: UTR123456</text><text x="40" y="140" font-family="Arial, sans-serif" font-size="14" fill="%2364748b">Student: Amit Rathore</text><text x="40" y="170" font-family="Arial, sans-serif" font-size="14" fill="%2364748b">Amount Paid: ₹12,000 via UPI</text><text x="40" y="200" font-family="Arial, sans-serif" font-size="14" fill="%2316a34a" font-weight="bold">STATUS: SUCCESS / VERIFIED</text><circle cx="500" cy="100" r="40" fill="%2322c55e" opacity="0.15"/><text x="475" y="107" font-family="Arial, sans-serif" font-size="28" fill="%2316a34a">✓</text></svg>',
    receiptDocumentName: 'bank_receipt_UTR123456.png',
    receiptDocumentType: 'image'
  },
  {
    id:'f2',
    invoiceNo:'INV-2024-002',
    studentId:'s2',
    studentName:'Priya Kumar',
    category:'Hostel Sem Fee',
    amount:12000,
    issueDate:'2024-08-01',
    dueDate:'2024-08-15',
    paidDate:'2024-08-12',
    paidAmount:12000,
    paymentMode:'NEFT/RTGS',
    transactionRef:'NEFT789',
    status:'paid',
    receiptDocument: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==',
    receiptDocumentName: 'neft_transfer_challan.pdf',
    receiptDocumentType: 'pdf'
  },
  {
    id:'f3',
    invoiceNo:'INV-2024-003',
    studentId:'s3',
    studentName:'Rahul Sharma',
    category:'Hostel Sem Fee',
    amount:12000,
    issueDate:'2024-08-01',
    dueDate:'2024-08-15',
    status:'pending',
    receiptDocument: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f1f5f9"/><rect x="20" y="20" width="560" height="360" rx="12" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="70" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="%230f172a">UPI PAYMENT SUBMITTED — AWAITING VERIFICATION</text><text x="40" y="110" font-family="Arial, sans-serif" font-size="14" fill="%2364748b">Txn Ref: UPI9988771122</text><text x="40" y="140" font-family="Arial, sans-serif" font-size="14" fill="%2364748b">Student: Rahul Sharma</text><text x="40" y="170" font-family="Arial, sans-serif" font-size="14" fill="%2364748b">Amount: ₹12,000</text><circle cx="500" cy="100" r="40" fill="%23f59e0b" opacity="0.15"/><text x="485" y="108" font-family="Arial, sans-serif" font-size="24" fill="%23d97706">⏳</text></svg>',
    receiptDocumentName: 'upi_payment_screenshot_pending.png',
    receiptDocumentType: 'image'
  },
  { id:'f4', invoiceNo:'INV-2024-004', studentId:'s4', studentName:'Sneha Mehta',  category:'Hostel Sem Fee', amount:12000, issueDate:'2024-08-01', dueDate:'2024-08-15', paidDate:'2024-08-08', paidAmount:12000, paymentMode:'Cash', status:'paid' },
  { id:'f5', invoiceNo:'INV-2024-005', studentId:'s6', studentName:'Kavya Nair',   category:'Hostel Sem Fee', amount:12000, issueDate:'2024-08-01', dueDate:'2024-08-15', status:'overdue' },
  { id:'f6', invoiceNo:'INV-2024-006', studentId:'s5', studentName:'Vikram Gupta', category:'Mess Fee',       amount:4500,  issueDate:'2024-08-01', dueDate:'2024-09-20', status:'pending' },
  {
    id:'f7',
    invoiceNo:'INV-2024-007',
    studentId:'s7',
    studentName:'Arjun Singh',
    category:'Hostel Sem Fee',
    amount:12000,
    issueDate:'2024-08-01',
    dueDate:'2024-08-15',
    paidDate:'2024-08-11',
    paidAmount:12000,
    paymentMode:'UPI',
    status:'paid',
    receiptDocument: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f0fdf4"/><rect x="20" y="20" width="560" height="360" rx="12" fill="%23ffffff" stroke="%2386efac" stroke-width="2"/><text x="40" y="70" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="%23166534">GOOGLE PAY TRANSACTION SLIP</text><text x="40" y="110" font-family="Arial, sans-serif" font-size="14" fill="%23475569">Paid to: Hostel Administration</text><text x="40" y="140" font-family="Arial, sans-serif" font-size="14" fill="%23475569">Student: Arjun Singh</text><text x="40" y="170" font-family="Arial, sans-serif" font-size="14" fill="%23475569">Amount: ₹12,000 | Mode: UPI</text><circle cx="500" cy="100" r="40" fill="%2316a34a" opacity="0.15"/><text x="480" y="108" font-family="Arial, sans-serif" font-size="24" fill="%2316a34a">✓</text></svg>',
    receiptDocumentName: 'gpay_receipt_arjun.png',
    receiptDocumentType: 'image'
  },
  { id:'f8', invoiceNo:'INV-2024-008', studentId:'s8', studentName:'Divya Patel',  category:'Hostel Sem Fee', amount:12000, issueDate:'2024-08-01', dueDate:'2024-08-15', paidDate:'2024-08-09', paidAmount:12000, paymentMode:'NEFT/RTGS', status:'paid' },
];

export const mockComplaints: Complaint[] = [
  {
    id: 'c1',
    ticketId: '#0045',
    studentId: 's1',
    studentName: 'Amit Rathore',
    roomNumber: 'A-101',
    category: 'Electrical',
    title: 'Power socket burned out',
    description: 'Power socket not working in room A-101 near study table',
    priority: 'High',
    status: 'open',
    raisedDate: '2026-09-22',
    proofDocument: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230f172a"/><rect x="160" y="70" width="280" height="260" rx="20" fill="%231e293b" stroke="%23475569" stroke-width="4"/><circle cx="250" cy="180" r="16" fill="%23020617"/><circle cx="350" cy="180" r="16" fill="%23020617"/><circle cx="300" cy="235" r="20" fill="%23020617"/><path d="M235 150 Q280 120 300 160 T365 140" stroke="%23f59e0b" stroke-width="6" fill="none"/><path d="M250 215 Q290 280 340 225" stroke="%23ef4444" stroke-width="6" fill="none"/><rect x="180" y="270" width="240" height="35" rx="8" fill="%237f1d1d" opacity="0.85"/><text x="300" y="293" fill="%23fecaca" font-size="14" font-family="system-ui,sans-serif" font-weight="bold" text-anchor="middle">BURN DAMAGE: ROOM A-101</text></svg>`,
    proofDocumentName: 'power_socket_burn_photo.png',
    proofDocumentType: 'image',
  },
  {
    id: 'c2',
    ticketId: '#0044',
    studentId: 's4',
    studentName: 'Sneha Mehta',
    roomNumber: 'D-112',
    category: 'Plumbing',
    title: 'Bathroom tap leakage',
    description: 'Tap leaking in bathroom D-112 constantly dripping',
    priority: 'High',
    status: 'in-progress',
    raisedDate: '2026-09-21',
    proofDocument: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA4NAo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjcwIDcwMCBUZAooSG9zdGVsIE1hbmFnZW1lbnQgU3lzdGVtIC0gUGx1bWJpbmcgSW5zcGVjdGlvbiBSZXBvcnQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxOCAwMDAwMCBuIAowMDAwMDAwMDY5IDAwMDAwIG4gCjAwMDAwMDAxMjUgMDAwMDAgbiAKMDAwMDAwMDI1OCAwMDAwMCBuIAowMDAwMDAwMzkzIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDc2CiUlRU9G',
    proofDocumentName: 'plumbing_leakage_inspection.pdf',
    proofDocumentType: 'pdf',
  },
  { id:'c3', ticketId:'#0043', studentId:'s2', studentName:'Priya Kumar',  roomNumber:'C-205', category:'Other Hostel Student / Resident', title: 'Late night noise disturbance', description:'Students in adjacent room playing loud music and shouting past midnight', priority:'Medium', status:'open', raisedDate:'2026-09-20' },
  { id:'c4', ticketId:'#0042', studentId:'s3', studentName:'Rahul Sharma', roomNumber:'B-310', category:'Hostel Residence & Facilities', title: 'Common area water cooler dirty', description:'Drinking water cooler on 3rd floor corridor has foul smell and uncleaned filters', priority:'Low', status:'in-progress', raisedDate:'2026-09-19' },
  { id:'c5', ticketId:'#0041', studentId:'s6', studentName:'Kavya Nair',   roomNumber:'A-202', category:'Electrical', title: 'Flickering lights in room', description:'Flickering lights in A-202 causing strain while studying', priority:'Medium', status:'resolved', raisedDate:'2026-09-17', resolvedDate:'2026-09-18', remarks:'Replaced faulty switch.' },
  {
    id: 'c6',
    ticketId: '#0040',
    studentId: 's5',
    studentName: 'Vikram Gupta',
    roomNumber: 'A-201',
    category: 'Furniture',
    title: 'Broken study chair',
    description: 'Study table chair leg is bent and unstable in A-201',
    priority: 'Low',
    status: 'open',
    raisedDate: '2026-09-18',
    proofDocument: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f1f5f9"/><rect x="200" y="80" width="200" height="150" rx="14" fill="%232563eb"/><line x1="230" y1="230" x2="220" y2="330" stroke="%23475569" stroke-width="12" stroke-linecap="round"/><line x1="370" y1="230" x2="410" y2="295" stroke="%23dc2626" stroke-width="12" stroke-linecap="round"/><line x1="410" y1="295" x2="435" y2="310" stroke="%23dc2626" stroke-width="8" stroke-linecap="round"/><text x="300" y="370" fill="%23dc2626" font-size="16" font-family="system-ui,sans-serif" font-weight="bold" text-anchor="middle">Broken Study Chair - Room A-201</text></svg>`,
    proofDocumentName: 'broken_chair_photo.jpg',
    proofDocumentType: 'image',
  },
];

export const mockVisitors: Visitor[] = [
  { id:'v1', visitorName:'Suresh Rathore', phone:'9876500001', hostStudentId:'s1', hostStudentName:'Amit Rathore', roomNumber:'A-101', purpose:'Family Visit', idProof:'Aadhaar Card', checkInTime:'10:30 AM', date:'2026-09-22', status:'accepted' },
  { id:'v2', visitorName:'Meena Sharma',   phone:'9100200300', hostStudentId:'s3', hostStudentName:'Rahul Sharma', roomNumber:'B-310', purpose:'Family Visit', idProof:'Aadhaar Card', checkInTime:'11:15 AM', date:'2026-09-22', status:'accepted' },
  { id:'v3', visitorName:'Ramesh Kumar',   phone:'9811122233', hostStudentId:'s2', hostStudentName:'Priya Kumar',  roomNumber:'C-205', purpose:'Academic',     idProof:'College ID',   checkInTime:'09:00 AM', date:'2026-09-22', status:'accepted' },
  { id:'v4', visitorName:'Anjali Verma',   phone:'9922334455', hostStudentId:'s4', hostStudentName:'Sneha Mehta',  roomNumber:'D-112', purpose:'Personal',     idProof:'PAN Card',     checkInTime:'08:30 AM', date:'2026-09-22', status:'pending' },
  { id:'v5', visitorName:'Deepak Nair',    phone:'9988765432', hostStudentId:'s6', hostStudentName:'Kavya Nair',   roomNumber:'A-202', purpose:'Family Visit', idProof:'Passport',     checkInTime:'02:00 PM', date:'2026-09-22', status:'rejected' },
];

export const mockNotices: Notice[] = [
  { id:'n1', title:'Water Supply Interruption — 23 Sep', content:'Water supply will be off from 9 AM to 1 PM on 23 Sep 2026 for pipeline maintenance. All blocks affected. Please store water in advance.', priority:'urgent',    publishedBy:'Warden Kamath',  publishedDate:'2026-09-22', expiryDate:'2026-09-24', target:'All Residents', pinned:true },
  { id:'n2', title:'Hostel Fee Deadline Reminder',        content:'Last date for Semester Fee payment is 30 Sep 2026. Defaulters will not be permitted to attend mid-terms. Contact the warden office for clarifications.', priority:'important', publishedBy:'Accounts Office', publishedDate:'2026-09-20', expiryDate:'2026-09-30', target:'All Residents', pinned:false },
  { id:'n3', title:'Gate Closing Time Update — October',  content:'With effect from 1 Oct 2026, the hostel main gate will close at 9:00 PM (previously 9:30 PM). All residents must be back before gate closing.', priority:'general',   publishedBy:'Warden Kamath',  publishedDate:'2026-09-18', expiryDate:'2026-10-31', target:'All Residents', pinned:false },
  { id:'n4', title:'Room Inspection — Block A & B',       content:'Room inspection will be conducted in Block A and Block B on 25 Sep 2026. All students must ensure rooms are clean and in proper order.', priority:'important', publishedBy:'Warden Kamath',  publishedDate:'2026-09-17', expiryDate:'2026-09-25', target:'Block A, Block B', pinned:false },
  { id:'n5', title:"Fresher's Welcome Event",             content:"A welcome event for new hostel residents will be held in the common room on 28 Sep 2026 at 6 PM. All senior residents are also invited.", priority:'general',   publishedBy:'Student Council', publishedDate:'2026-09-15', expiryDate:'2026-09-29', target:'All Residents', pinned:false },
  { id:'n6', title:'Wi-Fi Password Update',               content:'The hostel Wi-Fi password has been updated. Contact the warden office or IT desk to get the new credentials. Your student ID is required.', priority:'general',   publishedBy:'IT Department',  publishedDate:'2026-09-10', expiryDate:'2026-12-31', target:'All Residents', pinned:false },
];

export const mockDashboardStats: DashboardStats = {
  totalStudents: 342,
  occupancyPercent: 87,
  feeDefaulters: 28,
  openComplaints: 17,
  totalRooms: 342,
  occupiedRooms: 298,
  vacantRooms: 44,
  totalFeeCollected: 1422000,
};

export const mockBlockOccupancy: BlockOccupancy[] = [
  { block: 'A', label: 'Block A (Boys)',  occupied: 92, vacant: 8,  total: 100, percent: 92 },
  { block: 'B', label: 'Block B (Boys)',  occupied: 85, vacant: 15, total: 100, percent: 85 },
  { block: 'C', label: 'Block C (Girls)', occupied: 90, vacant: 10, total: 100, percent: 90 },
  { block: 'D', label: 'Block D (Girls)', occupied: 78, vacant: 22, total: 100, percent: 78 },
];
