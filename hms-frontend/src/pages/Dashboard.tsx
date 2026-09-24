import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import KpiCard from '../components/ui/KpiCard';
import Badge from '../components/ui/Badge';
import OccupancyBarChart from '../components/charts/OccupancyBarChart';
import { mockDashboardStats, mockBlockOccupancy, mockStudents, mockComplaints, mockFees, mockVisitors, mockNotices } from '../data/mockData';
import { Users, Building, Wrench, Key, CreditCard, Megaphone, UserCheck, Clock, Send, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStoredData } from '../utils/storage';

const Dashboard: React.FC = () => {
  const { user, role } = useAuth();
  const isStudent = role === 'student';

  const storedStudents = getStoredData('hms_students_data', mockStudents);
  const storedFees = getStoredData('hms_fees_data', mockFees);
  const storedComplaints = getStoredData('hms_complaints_data', mockComplaints);
  const storedVisitors = getStoredData('hms_visitors_data', mockVisitors);

  const currentStudent = storedStudents.find(s =>
    (user?.studentId && s.studentId.toLowerCase() === user.studentId.toLowerCase()) ||
    (user?.id && s.id === user.id) ||
    (user?.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
    (user?.name && `${s.firstName} ${s.lastName}`.toLowerCase() === user.name.toLowerCase())
  ) || storedStudents[0];

  const studentFullName = `${currentStudent.firstName} ${currentStudent.lastName}`.toLowerCase();

  const myFees = storedFees.filter(f =>
    f.studentId === currentStudent.id ||
    (user?.studentId && f.studentId?.toLowerCase() === user.studentId.toLowerCase()) ||
    f.studentName.toLowerCase().includes(currentStudent.firstName.toLowerCase()) ||
    f.studentName.toLowerCase() === studentFullName
  );

  const myComplaints = storedComplaints.filter(c =>
    c.studentId === currentStudent.id ||
    (user?.studentId && c.studentId?.toLowerCase() === user.studentId.toLowerCase()) ||
    c.studentName.toLowerCase().includes(currentStudent.firstName.toLowerCase()) ||
    c.studentName.toLowerCase() === studentFullName
  );

  const myVisitors = storedVisitors.filter(v =>
    v.hostStudentId === currentStudent.id ||
    (user?.studentId && v.hostStudentId?.toLowerCase() === user.studentId.toLowerCase()) ||
    v.hostStudentName.toLowerCase().includes(currentStudent.firstName.toLowerCase()) ||
    v.hostStudentName.toLowerCase() === studentFullName
  );

  const pendingDues = myFees
    .filter(f => f.status !== 'paid')
    .reduce((acc, f) => acc + f.amount, 0);

  const activeComplaintsCount = myComplaints.filter(c => c.status !== 'resolved').length;
  const activeVisitorsInside = myVisitors.filter(v => v.status === 'inside').length;

  // ============================================================
  // STUDENT PERSONAL DASHBOARD
  // ============================================================
  if (isStudent) {
    return (
      <PageLayout>
        <div className="student-profile-container">
          <div className="page-header-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 className="page-title" style={{ margin: 0 }}>Student Dashboard</h1>
                <span className="profile-pill highlight">
                  <ShieldCheck size={14} /> Resident Portal
                </span>
              </div>
              <p className="page-subtitle">
                Welcome back, {currentStudent.firstName}! Here is your current hostel status & activity.
              </p>
            </div>
            <div className="page-header-actions">
              <Link to="/students" className="btn btn-outline-dark btn-sm">
                <UserCheck size={14} /> My Profile
              </Link>
            </div>
          </div>

          {/* Student Personal KPI Row */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="kpi-card accent">
              <div className="kpi-label">
                <span>My Room</span>
                <span className="icon"><Key size={20} /></span>
              </div>
              <div className="kpi-value" style={{ fontSize: '1.8rem' }}>
                {currentStudent.roomNumber || 'A-101'}
              </div>
              <div className="kpi-change up">
                {currentStudent.blockName || 'Block A'} · Bed Allocated
              </div>
            </div>

            <div className={`kpi-card ${pendingDues > 0 ? 'warning' : 'green'}`}>
              <div className="kpi-label">
                <span>Fee Balance</span>
                <span className="icon"><CreditCard size={20} /></span>
              </div>
              <div className="kpi-value" style={{ fontSize: '1.8rem' }}>
                ₹{pendingDues.toLocaleString('en-IN')}
              </div>
              <div className={`kpi-change ${pendingDues > 0 ? 'down' : 'up'}`}>
                {pendingDues > 0 ? 'Pending semester fees' : 'All dues cleared'}
              </div>
            </div>

            <div className={`kpi-card ${activeComplaintsCount > 0 ? 'danger' : 'green'}`}>
              <div className="kpi-label">
                <span>My Complaints</span>
                <span className="icon"><Wrench size={20} /></span>
              </div>
              <div className="kpi-value" style={{ fontSize: '1.8rem' }}>
                {activeComplaintsCount}
              </div>
              <div className={`kpi-change ${activeComplaintsCount > 0 ? 'down' : 'up'}`}>
                {activeComplaintsCount > 0 ? 'Active maintenance issues' : 'No open issues'}
              </div>
            </div>

            <div className="kpi-card green">
              <div className="kpi-label">
                <span>My Visitors</span>
                <span className="icon"><Users size={20} /></span>
              </div>
              <div className="kpi-value" style={{ fontSize: '1.8rem' }}>
                {myVisitors.length}
              </div>
              <div className="kpi-change up">
                {activeVisitorsInside > 0 ? `${activeVisitorsInside} currently on campus` : 'Logged guest visits'}
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div
            style={{
              background: 'var(--clr-surface)',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--clr-text)' }}>
                Hostel Resident Quick Actions
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>
                Submit institutional requests directly to the warden office
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/rooms" className="btn btn-outline btn-sm">
                <Key size={14} /> Request Room Change
              </Link>
              <Link to="/fees" className="btn btn-outline btn-sm">
                <Send size={14} /> Send Fee Payment
              </Link>
              <Link to="/complaints" className="btn btn-outline btn-sm">
                <Wrench size={14} /> Lodge Complaint
              </Link>
              <Link to="/visitors" className="btn btn-outline btn-sm">
                <Users size={14} /> Pre-Register Guest
              </Link>
            </div>
          </div>

          {/* Two Columns: Notices & My Issues */}
          <div className="profile-sections-grid">
            {/* Notices Widget */}
            <div className="profile-card">
              <div className="profile-card-header">
                <h3 className="profile-card-title">
                  <Megaphone size={17} style={{ color: 'var(--clr-primary)' }} />
                  <span>Important Notices for Residents</span>
                </h3>
                <Link to="/notices" className="btn btn-outline-dark btn-sm" style={{ padding: '3px 8px', fontSize: '0.74rem' }}>
                  All Notices <ArrowRight size={12} />
                </Link>
              </div>

              <div className="profile-card-body">
                {mockNotices.slice(0, 3).map(n => (
                  <div
                    key={n.id}
                    style={{
                      background: 'var(--clr-bg)',
                      border: '1px solid var(--clr-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{n.title}</span>
                      <Badge variant={n.priority === 'urgent' ? 'danger' : 'info'}>
                        {n.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)', lineHeight: 1.4 }}>
                      {n.content}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>
                      {n.publishedDate} · {n.publishedBy}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* My Active Service Tickets */}
            <div className="profile-card">
              <div className="profile-card-header">
                <h3 className="profile-card-title">
                  <Clock size={17} style={{ color: 'var(--clr-primary)' }} />
                  <span>My Active Service & Maintenance Tickets</span>
                </h3>
                <Link to="/complaints" className="btn btn-outline-dark btn-sm" style={{ padding: '3px 8px', fontSize: '0.74rem' }}>
                  View All <ArrowRight size={12} />
                </Link>
              </div>

              <div className="profile-card-body">
                {myComplaints.slice(0, 3).map(c => (
                  <div
                    key={c.id}
                    style={{
                      background: 'var(--clr-bg)',
                      border: '1px solid var(--clr-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                        {c.ticketId} — {c.category}
                      </span>
                      <Badge variant={c.status === 'open' ? 'danger' : c.status === 'in-progress' ? 'info' : 'active'}>
                        {c.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)' }}>
                      {c.description}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>
                      Priority: {c.priority} · Raised on: {c.raisedDate}
                    </div>
                  </div>
                ))}

                {myComplaints.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '36px', color: 'var(--clr-text-muted)' }}>
                    No maintenance issues reported for Room {currentStudent.roomNumber || 'A-101'}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ============================================================
  // ADMIN DASHBOARD (Master operational overview)
  // ============================================================
  const s = mockDashboardStats;
  const recentStudents = storedStudents.slice(0, 5);
  const openComplaints = storedComplaints.filter(c => c.status !== 'resolved').slice(0, 5);

  return (
    <PageLayout>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Operational overview — Mon, 22 Sep 2026</p>
        </div>
        <Link to="/students" className="btn btn-primary">+ Add Student</Link>
      </div>

      {/* KPI ROW */}
      <div className="kpi-grid">
        <KpiCard label="Total Students" value={s.totalStudents} change="↑ 12 this month" changeType="up" accent="green" icon={<Users size={24} />} delay={0} />
        <KpiCard label="Rooms Occupied" value={`${s.occupancyPercent}%`} change="↑ 3% vs last month" changeType="up" accent="accent" icon={<Building size={24} />} delay={0.1} />
        <KpiCard label="Open Complaints" value={s.openComplaints} change="3 high priority" changeType="down" accent="danger" icon={<Wrench size={24} />} delay={0.3} />
      </div>

      {/* CHARTS */}
      <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card">
          <div className="chart-title">Room Occupancy by Block</div>
          <div className="chart-subtitle">Occupied vs Vacant beds per hostel block</div>
          <OccupancyBarChart data={mockBlockOccupancy} />
        </div>
      </div>

      {/* UTILIZATION + FEE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="chart-card">
          <div className="chart-title">Block-wise Utilization</div>
          <div className="chart-subtitle">Bed occupancy % per block</div>
          <div className="progress-bar-wrap" style={{ marginTop: 8 }}>
            {mockBlockOccupancy.map(b => (
              <div className="progress-row" key={b.block}>
                <div className="progress-meta"><span>{b.label}</span><span>{b.percent}%</span></div>
                <div className="progress-track">
                  <div className={`progress-fill${b.block === 'C' || b.block === 'D' ? ' accent' : ''}`} style={{ width: `${b.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Fee Collection — Sep 2026</div>
          <div className="chart-subtitle">Semester payment status</div>
          <div className="progress-bar-wrap" style={{ marginTop: 8 }}>
            <div className="progress-row">
              <div className="progress-meta"><span>Paid</span><span>314 students</span></div>
              <div className="progress-track"><div className="progress-fill" style={{ width: '91.8%' }} /></div>
            </div>
            <div className="progress-row">
              <div className="progress-meta"><span>Pending / Overdue</span><span>28 students</span></div>
              <div className="progress-track"><div className="progress-fill warning" style={{ width: '8.2%' }} /></div>
            </div>
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--clr-border)' }}>
            <div style={{ fontSize: '.75rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Total Collected</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--clr-text)', letterSpacing: -1 }}>
              ₹{(s.totalFeeCollected / 100000).toFixed(1)}L
            </div>
            <div style={{ fontSize: '.8rem', color: 'var(--clr-success)', fontWeight: 600, marginTop: 4 }}>↑ 6% vs last semester</div>
          </div>
        </div>
      </div>

      {/* STUDENTS TABLE */}
      <div className="data-table-card" style={{ marginBottom: 24 }}>
        <div className="data-table-header">
          <h3>Recently Registered Students</h3>
          <Link to="/students" className="btn btn-primary btn-sm">View All</Link>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Student</th><th>ID</th><th>Course</th><th>Room</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {recentStudents.map(st => (
                <tr key={st.id}>
                  <td>
                    <div className="avatar-row">
                      <div className={`avatar${st.id === 's2' || st.id === 's4' || st.id === 's6' || st.id === 's8' ? ' avatar-alt' : ''}`}>{st.avatar}</div>
                      <div className="avatar-info">
                        <span className="avatar-name">{st.firstName} {st.lastName}</span>
                        <span className="avatar-sub">{st.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{st.studentId}</td>
                  <td>{st.course} {st.semester}</td>
                  <td>{st.roomNumber ?? '—'}</td>
                  <td>
                    <Badge variant={st.status === 'active' ? 'active' : st.status === 'fee-due' ? 'pending' : 'vacant'}>
                      {st.status === 'fee-due' ? 'Fee Due' : st.status === 'unassigned' ? 'Unassigned' : 'Active'}
                    </Badge>
                  </td>
                  <td>
                    <Link to="/students" className="btn btn-outline-dark btn-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTIVITY + COMPLAINTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="activity-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Recent Activity</span>
          </div>
          <div className="activity-list">
            {[
              { icon: <Key size={18} />, title: 'Room A-202 Allocated', desc: 'Assigned to Kavya Nair (STU-2024-006)', time: '2m ago' },
              { icon: <CreditCard size={18} />, title: 'Fee Payment Received', desc: '₹12,000 from Rahul Sharma', time: '18m ago' },
              { icon: <Wrench size={18} />, title: 'Complaint Resolved', desc: 'Ticket #0041 — Electrical Issue, A-202', time: '1h ago' },
              { icon: <Megaphone size={18} />, title: 'Notice Published', desc: 'Gate closing time update for October', time: '3h ago' },
              { icon: <Users size={18} />, title: 'Visitor Logged', desc: 'Suresh Rathore visited Amit Rathore', time: '5h ago' },
            ].map((a, i) => (
              <div className="activity-item" key={i}>
                <div className="activity-icon">{a.icon}</div>
                <div className="activity-text"><strong>{a.title}</strong><p>{a.desc}</p></div>
                <span className="activity-time">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="data-table-card" style={{ marginBottom: 0 }}>
          <div className="data-table-header">
            <h3>Open Complaints</h3>
            <Link to="/complaints" className="btn btn-outline-dark btn-sm">View All</Link>
          </div>
          <table className="data-table">
            <thead><tr><th>Ticket</th><th>Category</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {openComplaints.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.ticketId}</td>
                  <td>{c.category}</td>
                  <td><span className={`priority-${c.priority.toLowerCase()}`}>{c.priority}</span></td>
                  <td>
                    <Badge variant={c.status === 'open' ? 'danger' : 'info'}>
                      {c.status === 'in-progress' ? 'In Progress' : 'Open'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
