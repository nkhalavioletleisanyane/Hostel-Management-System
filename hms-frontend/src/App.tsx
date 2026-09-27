import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import './styles/globals.css';
import './styles/components.css';
import './styles/rooms.css';
import { LogoIcon } from './components/ui/Logo';

// Pages (lazy-loaded for performance)
const Home       = React.lazy(() => import('./pages/Home'));
const Login      = React.lazy(() => import('./pages/Login'));
const Signup     = React.lazy(() => import('./pages/Signup'));
const Dashboard  = React.lazy(() => import('./pages/Dashboard'));
const Students   = React.lazy(() => import('./pages/Students'));
const Rooms      = React.lazy(() => import('./pages/Rooms'));
const Fees       = React.lazy(() => import('./pages/Fees'));
const Complaints = React.lazy(() => import('./pages/Complaints'));
const Visitors   = React.lazy(() => import('./pages/Visitors'));
const Notices    = React.lazy(() => import('./pages/Notices'));

// Protected route wrapper
const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public-only route wrapper (redirects logged-in users directly to their dashboard)
const PublicOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

// Loading spinner
const LoadingFallback = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: 'var(--clr-bg)',
    gap: 16, flexDirection: 'column',
  }}>
    <div style={{ animation: 'pulse 1.8s ease-in-out infinite', filter: 'drop-shadow(0 6px 20px rgba(99, 102, 241, 0.35))' }}>
      <LogoIcon size={56} />
    </div>
    <span style={{ fontSize: '0.92rem', color: 'var(--clr-text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
      Loading HMS…
    </span>
  </div>
);

const AppRoutes: React.FC = () => (
  <React.Suspense fallback={<LoadingFallback />}>
    <Routes>
      <Route path="/"          element={<Home />} />
      <Route path="/login"     element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup"    element={<PublicOnly><Signup /></PublicOnly>} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/students"  element={<Protected><Students /></Protected>} />
      <Route path="/rooms"     element={<Protected><Rooms /></Protected>} />
      <Route path="/fees"      element={<Protected><Fees /></Protected>} />
      <Route path="/complaints"element={<Protected><Complaints /></Protected>} />
      <Route path="/visitors"  element={<Protected><Visitors /></Protected>} />
      <Route path="/notices"   element={<Protected><Notices /></Protected>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  </React.Suspense>
);

const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <SidebarProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
