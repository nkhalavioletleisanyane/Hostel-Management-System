import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Sun,
  Moon,
  Menu,
  X,
  Home,
  LayoutDashboard,
  UserCheck,
  Building,
  CreditCard,
  Wrench,
  Users,
  Megaphone,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import '../../styles/navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu automatically on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isStudent = role === 'student';

  const navLinks = [
    { to: '/',           label: 'Home',                   icon: <Home size={15} /> },
    { to: '/dashboard',  label: 'Dashboard',              icon: <LayoutDashboard size={15} /> },
    { to: '/students',   label: isStudent ? 'My Profile' : 'Students', icon: <UserCheck size={15} /> },
    { to: '/rooms',      label: isStudent ? 'My Room' : 'Rooms',       icon: <Building size={15} /> },
    { to: '/fees',       label: isStudent ? 'My Fees' : 'Fees',       icon: <CreditCard size={15} /> },
    { to: '/complaints', label: isStudent ? 'My Complaints' : 'Complaints', icon: <Wrench size={15} /> },
    { to: '/visitors',   label: isStudent ? 'My Visitors' : 'Visitors', icon: <Users size={15} /> },
    { to: '/notices',    label: isStudent ? 'Notice Board' : 'Notices', icon: <Megaphone size={15} /> },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="nav-inner">
          <Link to="/" className="nav-brand" onClick={() => setMenuOpen(false)}>
            <span className="brand-icon">🏠</span>
            <span className="brand-text">HMS</span>
            {isAuthenticated && (
              <span className={`nav-role-badge ${isStudent ? 'student' : 'admin'}`}>
                {isStudent ? 'Student' : 'Admin'}
              </span>
            )}
          </Link>

          {/* Desktop Navigation Links — strict no-wrap & horizontally adaptive */}
          <ul className="nav-links desktop-nav">
            {navLinks.map(link => {
              const isActive = location.pathname === link.to;
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`nav-link${isActive ? ' active' : ''}`}
                    title={link.label}
                  >
                    <span className="nav-link-icon">{link.icon}</span>
                    <span className="nav-link-text">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="nav-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {isAuthenticated ? (
              <div className="nav-user-wrapper">
                <span className="nav-user" title={user?.name}>
                  <UserIcon size={14} className="user-avatar-icon" />
                  <span className="nav-user-name">{user?.name}</span>
                </span>
                <button
                  className="btn btn-outline-dark btn-sm nav-logout-btn"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut size={14} />
                  <span className="logout-text">Logout</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
            )}

            <button
              className={`nav-hamburger${menuOpen ? ' open' : ''}`}
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label={menuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Responsive Drawer for Tablets & Mobile Screens */}
        <div className={`nav-mobile-drawer${menuOpen ? ' open' : ''}`}>
          {isAuthenticated && (
            <div className="nav-mobile-user-card">
              <div className="nav-mobile-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="nav-mobile-user-details">
                <div className="nav-mobile-user-name">{user?.name}</div>
                <div className="nav-mobile-user-role">
                  {isStudent ? 'Resident Student' : 'Hostel Administrator'}
                </div>
              </div>
            </div>
          )}

          <ul className="nav-mobile-list">
            {navLinks.map(link => {
              const isActive = location.pathname === link.to;
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`nav-mobile-item${isActive ? ' active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="nav-mobile-item-icon">{link.icon}</span>
                    <span className="nav-mobile-item-label">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {isAuthenticated && (
            <div className="nav-mobile-footer">
              <button
                className="btn btn-danger btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => { setMenuOpen(false); logout(); }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Backdrop overlay for mobile drawer */}
      {menuOpen && (
        <div
          className="nav-drawer-backdrop"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
