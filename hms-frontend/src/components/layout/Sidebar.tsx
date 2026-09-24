import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building,
  CreditCard,
  Wrench,
  Megaphone,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import '../../styles/sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout, role } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const isStudent = role === 'student';

  const sidebarItems = [
    { section: 'Overview' },
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { section: isStudent ? 'Student Space' : 'Management' },
    {
      to: '/students',
      icon: isStudent ? <UserCheck size={20} /> : <Users size={20} />,
      label: isStudent ? 'My Profile' : 'Students',
    },
    { to: '/rooms',      icon: <Building size={20} />, label: isStudent ? 'My Room' : 'Rooms' },
    { to: '/fees',       icon: <CreditCard size={20} />, label: isStudent ? 'My Fees' : 'Fees' },
    { to: '/complaints', icon: <Wrench size={20} />, label: isStudent ? 'My Complaints' : 'Complaints' },
    { to: '/visitors',   icon: <Users size={20} />, label: isStudent ? 'My Visitors' : 'Visitors' },
    { to: '/notices',    icon: <Megaphone size={20} />, label: isStudent ? 'Notice Board' : 'Notices' },
    { section: 'Account' },
  ];

  return (
    <>
      {/* Floating edge toggle button with < (hide) and > (unhide) */}
      <button
        type="button"
        className={`sidebar-edge-toggle${isCollapsed ? ' collapsed' : ''}`}
        onClick={toggleSidebar}
        title={isCollapsed ? 'Show left panel (>)' : 'Hide left panel (<)'}
        aria-label={isCollapsed ? 'Show left panel' : 'Hide left panel'}
      >
        {isCollapsed ? (
          <ChevronRight size={17} strokeWidth={2.4} />
        ) : (
          <ChevronLeft size={17} strokeWidth={2.4} />
        )}
      </button>

      <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}`} aria-hidden={isCollapsed}>
        {sidebarItems.map((item, i) => {
          if ('section' in item) {
            // First section ('Overview') gets an inline collapse button '<' as well
            if (i === 0) {
              return (
                <div className="sidebar-section sidebar-section-header" key={i}>
                  <span>{item.section}</span>
                  <button
                    type="button"
                    className="sidebar-header-collapse-btn"
                    onClick={toggleSidebar}
                    title="Hide left panel (<)"
                    aria-label="Hide left panel"
                  >
                    <ChevronLeft size={15} strokeWidth={2.4} />
                  </button>
                </div>
              );
            }
            return <div className="sidebar-section" key={i}>{item.section}</div>;
          }
          return (
            <Link
              key={item.to}
              to={item.to!}
              className={`sidebar-link${location.pathname === item.to ? ' active' : ''}`}
            >
              <span className="s-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        <button className="sidebar-link sidebar-logout" onClick={logout}>
          <span className="s-icon"><LogOut size={20} /></span> Logout
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
