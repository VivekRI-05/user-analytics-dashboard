import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const Dashboard = () => {
  const userRole = localStorage.getItem('userRole');
  const userId = localStorage.getItem('userId');
  const [permissions, setPermissions] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    try {
      const storedPermissions = localStorage.getItem('userPermissions');
      const parsedPermissions = JSON.parse(storedPermissions || '{}');
      setPermissions(parsedPermissions);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError(err.message);
    }
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-red-600 font-semibold">Error Loading Dashboard</h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Welcome to Rinexis Authorization Tool</h1>
        
        {/* User Info */}
        <div className="mb-6">
          <p className="text-lg">
            Logged in as: <span className="font-semibold">{userId}</span>
          </p>
          <p className="text-gray-600">
            Role: <span className="capitalize">{userRole}</span>
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">Total Users</h3>
            <p className="text-2xl font-bold">--</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">Active Roles</h3>
            <p className="text-2xl font-bold">--</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">Risk Alerts</h3>
            <p className="text-2xl font-bold">--</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Recent Activity</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">No recent activity to display</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {permissions?.audit?.userAnalysis && (
              <div className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer"
                   onClick={() => window.location.href = '/user-analysis'}>
                <h3 className="font-semibold mb-2">User Analysis</h3>
                <p className="text-sm text-gray-600">
                  Analyze user access patterns and permissions
                </p>
              </div>
            )}
            
            {permissions?.audit?.roleAnalysis && (
              <div className="p-4 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer"
                   onClick={() => window.location.href = '/role-analysis'}>
                <h3 className="font-semibold mb-2">Role Risk Analysis</h3>
                <p className="text-sm text-gray-600">
                  Review and analyze role configurations
                </p>
              </div>
            )}

            {permissions?.userAccessReview && (
              <div className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 cursor-pointer"
                   onClick={() => window.location.href = '/user-access-review'}>
                <h3 className="font-semibold mb-2">User Access Review</h3>
                <p className="text-sm text-gray-600">
                  Review user access and permissions
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Only show permissions card for admin users */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>System Permissions Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Audit Permissions */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Audit</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    Enabled: {permissions?.audit?.enabled ? '✅' : '❌'}
                  </li>
                  <li>
                    User Analysis: {permissions?.audit?.userAnalysis ? '✅' : '❌'}
                  </li>
                  <li>
                    Role Risk Analysis: {permissions?.audit?.roleAnalysis ? '✅' : '❌'}
                  </li>
                  <li>
                    Combined Analysis: {permissions?.audit?.combinedAnalysis ? '✅' : '❌'}
                  </li>
                  <li>
                    Recommendations: {permissions?.audit?.recommendations ? '✅' : '❌'}
                  </li>
                </ul>
              </div>

              {/* Review Permissions */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold mb-2">Reviews</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    User Access Review: {permissions?.userAccessReview ? '✅' : '❌'}
                  </li>
                  <li>
                    SOR Review: {permissions?.sorReview ? '✅' : '❌'}
                  </li>
                </ul>
              </div>

              {/* Other Permissions */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold mb-2">Other Access</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    Super User Access: {permissions?.superUserAccess ? '✅' : '❌'}
                  </li>
                  <li>
                    Dashboard: {permissions?.dashboard ? '✅' : '❌'}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard; 