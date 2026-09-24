import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import WaveBackground from '../components/ui/WaveBackground';
import '../styles/home.css';

const MODULES = [
  { icon: '👥', title: 'Student Management', desc: 'Registration, profiles, academic records and directory search.', to: '/students' },
  { icon: '🏢', title: 'Hostel & Room Admin', desc: 'Blocks, floor plans, bed capacity and real-time occupancy.', to: '/rooms' },
  { icon: '🛏️', title: 'Room Allocation', desc: 'Capacity safeguards, vacating workflows and room swaps.', to: '/rooms' },
  { icon: '💵', title: 'Fee & Billing', desc: 'Tariffs, invoices, payment history and dues tracking.', to: '/fees' },
  { icon: '🎫', title: 'Complaint Tickets', desc: 'Submission, category tracking and SLA resolution logs.', to: '/complaints' },
  { icon: '🤝', title: 'Visitor Registry', desc: 'Guest check-in/out timestamps and host verification.', to: '/visitors' },
  { icon: '🔔', title: 'Notice Bulletins', desc: 'Circulars, emergency alerts and date-bound validity.', to: '/notices' },
  { icon: '📈', title: 'Dashboard & Reports', desc: 'Occupancy %, dues overview and open ticket counts.', to: '/dashboard', accent: true },
];

const Home: React.FC = () => (
  <div className="home-page-wrapper">
    <WaveBackground fixed />
    <Navbar />

    {/* HERO */}
    <section className="hero-section">
      <div className="container">
        <div className="hero-badge fade-in">
          <span className="badge-dot" />
          Web-Based Platform &middot; React + TypeScript
        </div>
        <h1 className="hero-title fade-in">
          Hostel Management<br />
          <span className="hero-accent">System</span>
        </h1>
        <p className="hero-sub fade-in">
          A centralized digital platform automating student accommodation, room allocations,
          fee tracking, visitor logs, and administrative workflows — built with React &amp; TypeScript.
        </p>
        <div className="hero-cta fade-in">
          <Link to="/login" className="btn btn-primary btn-lg">Get Started →</Link>
          <Link to="/dashboard" className="btn btn-ghost btn-lg">View Dashboard</Link>
        </div>
        <div className="hero-stats fade-in">
          <div className="stat-card"><span className="stat-num">80%</span><span className="stat-label">Less Paperwork</span></div>
          <div className="stat-card"><span className="stat-num">0</span><span className="stat-label">Conflicts</span></div>
          <div className="stat-card"><span className="stat-num">10+</span><span className="stat-label">Modules</span></div>
          <div className="stat-card"><span className="stat-num">24/7</span><span className="stat-label">Digital Access</span></div>
        </div>
      </div>
    </section>

    {/* MODULES */}
    <section className="section modules-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Everything You Need to Manage a Hostel</h2>
        </div>
        <div className="modules-grid">
          {MODULES.map(m => (
            <Link to={m.to} key={m.title} className={`module-card${m.accent ? ' module-card--accent' : ''}`}>
              <div className="module-icon">{m.icon}</div>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
              <span className="module-arrow">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>


    {/* FOOTER */}
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <Link to="/" className="nav-brand">
              <span className="brand-icon">🏠</span>
              <span className="brand-text">HMS</span>
            </Link>
            <p>Hostel Management System — a centralized digital platform for modern campus accommodation administration.</p>
          </div>
          <div className="footer-links-col">
            <h4>Modules</h4>
            <ul>
              <li><Link to="/students">Students</Link></li>
              <li><Link to="/rooms">Rooms</Link></li>
              <li><Link to="/fees">Fees</Link></li>
              <li><Link to="/complaints">Complaints</Link></li>
            </ul>
          </div>
          <div className="footer-links-col">
            <h4>System</h4>
            <ul>
              <li><Link to="/visitors">Visitors</Link></li>
              <li><Link to="/notices">Notices</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/login">Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Hostel Management System. All Rights Reserved.</span>
          <span>React · TypeScript · Node.js · PostgreSQL</span>
        </div>
      </div>
    </footer>
  </div>
);

export default Home;
