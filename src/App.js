import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import RoleAnalysisPage from './components/RoleAnalysisPage';
import UserAnalyticsDashboard from './components/UserAnalyticsDashboard';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/user-analysis" element={
          <ProtectedRoute>
            <UserAnalyticsDashboard />
          </ProtectedRoute>
        } />
        <Route path="/role-analysis" element={
          <ProtectedRoute>
            <RoleAnalysisPage />
          </ProtectedRoute>
        } />
        <Route path="/combined-analysis" element={
          <ProtectedRoute>
            <div>Combined Analysis - Coming Soon</div>
          </ProtectedRoute>
        } />
        <Route path="/recommendations" element={
          <ProtectedRoute>
            <div>Recommendations - Coming Soon</div>
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 