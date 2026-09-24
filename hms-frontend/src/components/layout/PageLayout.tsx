import React, { type ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useSidebar } from '../../context/SidebarContext';

interface PageLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, showSidebar = true }) => {
  const { isCollapsed } = useSidebar();
  const isHidden = !showSidebar || isCollapsed;

  return (
    <>
      <Navbar />
      <div className={`page-layout${isCollapsed ? ' sidebar-collapsed' : ''}`}>
        {showSidebar && <Sidebar />}
        <main
          className={`main-content${isHidden ? ' sidebar-collapsed' : ''}`}
          style={!showSidebar ? { marginLeft: 0 } : undefined}
        >
          {children}
        </main>
      </div>
    </>
  );
};

export default PageLayout;

