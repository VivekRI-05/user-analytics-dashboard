import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import UserAnalyticsDashboard from './components/UserAnalyticsDashboard';
import RoleAnalysisPage from './components/RoleAnalysisPage';
import AdminConsole from './components/AdminConsole';
import Dashboard from './components/Dashboard';
import RoleAnalysis from './components/RoleAnalysis';

const ProtectedRoute = ({ children, path }) => {
  console.log('ProtectedRoute rendering for path:', path);
  console.log('Children:', children);
  
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const isAdmin = localStorage.getItem('userRole') === 'admin';
  const permissions = JSON.parse(localStorage.getItem('userPermissions') || '{}');
  
  console.log('Auth status:', { isAuthenticated, isAdmin });
  console.log('Permissions:', permissions);

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // For dashboard, always allow access if authenticated
  if (path === '/dashboard') {
    console.log('Allowing dashboard access');
    return <Layout>{children}</Layout>;
  }

  if (isAdmin) {
    console.log('Admin user, rendering Layout with children');
    return <Layout>{children}</Layout>;
  }

  // For regular users, check permissions
  const hasPermission = () => {
    if (!path) return true;
    
    if (path.startsWith('/dashboard')) return true; // Always allow dashboard
    if (path.startsWith('/user-analysis')) return permissions?.audit?.userAnalysis;
    if (path.startsWith('/role-analysis')) return permissions?.audit?.roleAnalysis;
    if (path.startsWith('/combined-analysis')) return permissions?.audit?.combinedAnalysis;
    if (path.startsWith('/recommendations')) return permissions?.audit?.recommendations;
    if (path.startsWith('/user-access-review')) return permissions?.userAccessReview;
    if (path.startsWith('/sor-review')) return permissions?.sorReview;
    if (path.startsWith('/super-user-access')) return permissions?.superUserAccess;
    return false;
  };

  if (!hasPermission()) {
    console.log('No permission, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

function App() {
  console.log('App component rendering');
  return (
    <BrowserRouter>
      <div className="w-full min-h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/user-analysis" element={
            <ProtectedRoute path="/user-analysis">
              <UserAnalyticsDashboard />
            </ProtectedRoute>
          } />
          <Route path="/role-analysis" element={<RoleAnalysis />} />
          <Route path="/combined-analysis" element={
            <ProtectedRoute path="/combined-analysis">
              <div className="p-4">Combined Analysis - Coming Soon</div>
            </ProtectedRoute>
          } />
          <Route path="/recommendations" element={
            <ProtectedRoute path="/recommendations">
              <div className="p-4">Recommendations - Coming Soon</div>
            </ProtectedRoute>
          } />
          <Route path="/user-access-review" element={
            <ProtectedRoute path="/user-access-review">
              <div className="p-4">User Access Review - Coming Soon</div>
            </ProtectedRoute>
          } />
          <Route path="/sor-review" element={
            <ProtectedRoute path="/sor-review">
              <div className="p-4">SOR Review - Coming Soon</div>
            </ProtectedRoute>
          } />
          <Route path="/super-user-access" element={
            <ProtectedRoute path="/super-user-access">
              <div className="p-4">Super User Access - Coming Soon</div>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute path="/dashboard">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute path="/admin">
              <AdminConsole />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App; 