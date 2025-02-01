import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import UserAnalyticsDashboard from './components/UserAnalyticsDashboard';
import RoleAnalytics from './components/RoleAnalytics';
import Dashboard from './components/Dashboard';
import AdminConsole from './components/AdminConsole';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  console.log('App rendering'); // Debug log

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/user-analysis" element={<UserAnalyticsDashboard />} />
                  <Route path="/role-analysis" element={<RoleAnalytics />} />
                  <Route path="/combined-analysis" element={<div>Combined Analysis Content</div>} />
                  <Route path="/role-authorization-review" element={<div>Role Authorization Review</div>} />
                  <Route path="/recommendations" element={<div>Recommendations Content</div>} />
                  <Route path="/user-access-review" element={<div>User Access Review Content</div>} />
                  <Route path="/sor-review" element={<div>SOR Review Content</div>} />
                  <Route path="/admin" element={<AdminConsole />} />
                  <Route path="*" element={<div>Page Not Found</div>} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 