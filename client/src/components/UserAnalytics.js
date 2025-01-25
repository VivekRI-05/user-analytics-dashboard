import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Upload, Download } from 'lucide-react';

const UserAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  const analyzeUsers = (csvContent) => {
    try {
      const rows = csvContent.split('\n').slice(1);
      const analysis = {
        totalUsers: 0,
        departmentStats: {},
        roleDistribution: {},
        accessLevels: {
          high: 0,
          medium: 0,
          low: 0
        }
      };

      rows.forEach(row => {
        if (!row.trim()) return;
        
        const [user, department, roles] = row.split(',').map(field => field.trim());
        const userRoles = roles.split(';');
        
        // Count total users
        analysis.totalUsers++;

        // Department statistics
        if (!analysis.departmentStats[department]) {
          analysis.departmentStats[department] = {
            userCount: 0,
            roleCount: 0
          };
        }
        analysis.departmentStats[department].userCount++;
        analysis.departmentStats[department].roleCount += userRoles.length;

        // Role distribution
        userRoles.forEach(role => {
          if (!analysis.roleDistribution[role]) {
            analysis.roleDistribution[role] = 0;
          }
          analysis.roleDistribution[role]++;
        });

        // Access level analysis
        const accessLevel = userRoles.length > 5 ? 'high' : 
                          userRoles.length > 2 ? 'medium' : 'low';
        analysis.accessLevels[accessLevel]++;
      });

      return analysis;
    } catch (err) {
      console.error(err);
      setError('Error processing CSV file. Please check the format.');
      return null;
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setError(null);
        const text = e.target.result;
        const results = analyzeUsers(text);
        if (results) {
          setAnalytics(results);
        }
      };
      reader.onerror = () => {
        setError('Error reading the file. Please try again.');
      };
      reader.readAsText(file);
    }
  };

  const handleDownload = () => {
    if (!analytics) return;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalUsers: analytics.totalUsers,
        departmentStats: analytics.departmentStats,
        roleDistribution: analytics.roleDistribution,
        accessLevels: analytics.accessLevels
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-analysis-report.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">User Analysis Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!analytics ? (
          <label className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
            <Upload className="w-8 h-8 mb-2 text-gray-500" />
            <span className="text-sm text-gray-500">Upload User CSV file</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold">Total Users</h3>
                  <p className="text-2xl">{analytics.totalUsers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold">Departments</h3>
                  <p className="text-2xl">{Object.keys(analytics.departmentStats).length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold">High Access Users</h3>
                  <p className="text-2xl">{analytics.accessLevels.high}</p>
                </CardContent>
              </Card>
            </div>

            {/* Department Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(analytics.departmentStats).map(([dept, stats]) => ({
                        name: dept,
                        users: stats.userCount,
                        roles: stats.roleCount
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="users" fill="#8884d8" name="Users" />
                      <Bar dataKey="roles" fill="#82ca9d" name="Roles" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <button
                onClick={handleDownload}
                className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Report
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserAnalytics; 