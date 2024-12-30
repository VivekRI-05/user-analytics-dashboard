import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import UserAnalyticsDashboard from './UserAnalyticsDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/user-analysis" element={<UserAnalyticsDashboard />} />
          <Route path="/role-analysis" element={<div>Role Analysis - Coming Soon</div>} />
          <Route path="/combined-analysis" element={<div>Combined Analysis - Coming Soon</div>} />
          <Route path="/recommendations" element={<div>Recommendations - Coming Soon</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 