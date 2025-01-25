import React, { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Alert, AlertTitle, AlertDescription } from './components/ui/alert';
import { Upload, Users, Lock, Clock, ArrowLeft, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';

const COLORS = ['#4f46e5', '#f59e0b', '#ef4444', '#10b981'];

const UserAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const dashboardRef = useRef(null);

  const processData = (csvContent) => {
    try {
      const rows = csvContent.split('\n').slice(1);
      const currentDate = new Date();
      
      let expiredUsers = 0;
      let lockedUsers = 0;
      let inactiveUsers = 0;
      let totalUsers = 0;
      
      // For trend analysis
      const monthlyData = {};
      
      rows.forEach(row => {
        if (!row.trim()) return;
        
        const [
          userId, 
          validTo, 
          validThrough, 
          userGroup, 
          lockStatus, 
          creationDate, 
          lastLogonDate
        ] = row.split(',').map(field => field.trim());
        
        if (!userId) return;
        totalUsers++;
        
        // Basic metrics
        const validThroughDate = new Date(validThrough);
        if (validThroughDate < currentDate) {
          expiredUsers++;
        }
        
        if (parseInt(lockStatus) > 0) {
          lockedUsers++;
        }
        
        const lastLogon = new Date(lastLogonDate);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (lastLogon < thirtyDaysAgo) {
          inactiveUsers++;
        }

        // Monthly trends
        const month = new Date(creationDate).toLocaleString('default', { month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      // Convert monthly data to array
      const monthlyTrend = Object.entries(monthlyData).map(([month, count]) => ({
        month,
        count
      }));

      const activeUsers = totalUsers - (expiredUsers + lockedUsers + inactiveUsers);
      
      return {
        summaryData: [
          { name: 'Expired Users', value: expiredUsers, percentage: ((expiredUsers / totalUsers) * 100).toFixed(1) },
          { name: 'Locked Users', value: lockedUsers, percentage: ((lockedUsers / totalUsers) * 100).toFixed(1) },
          { name: 'Inactive Users', value: inactiveUsers, percentage: ((inactiveUsers / totalUsers) * 100).toFixed(1) }
        ],
        donutData: [
          { name: 'Active Users', value: activeUsers },
          { name: 'Expired Users', value: expiredUsers },
          { name: 'Locked Users', value: lockedUsers },
          { name: 'Inactive Users', value: inactiveUsers }
        ],
        monthlyTrend,
        totalUsers
      };
    } catch (err) {
      setError('Error processing CSV file. Please check the file format.');
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
        const results = processData(text);
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

  const handleDownload = async () => {
    if (!analytics || !dashboardRef.current) return;

    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: dashboardRef.current.scrollWidth,
        windowHeight: dashboardRef.current.scrollHeight
      });

      const image = canvas.toDataURL('image/png', 1.0);
      
      const link = document.createElement('a');
      link.download = 'user-analytics-dashboard.png';
      link.href = image;
      link.click();
    } catch (error) {
      console.error('Error generating dashboard image:', error);
    }
  };

  const MetricCard = ({ title, value, percentage, icon: Icon, color }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="flex items-baseline mt-1">
              <p className="text-2xl font-semibold">{value}</p>
              <p className="ml-2 text-sm text-gray-500">({percentage}%)</p>
            </div>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>
        {analytics && (
          <button
            onClick={handleDownload}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Dashboard
          </button>
        )}
      </div>
      
      <div ref={dashboardRef}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Rinexis Authorization Tool</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <label className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <span className="text-sm text-gray-500">Upload CSV file</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {analytics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <MetricCard 
                    title="Expired Users"
                    value={analytics.summaryData[0].value}
                    percentage={analytics.summaryData[0].percentage}
                    icon={Users}
                    color="bg-red-500"
                  />
                  <MetricCard 
                    title="Locked Users"
                    value={analytics.summaryData[1].value}
                    percentage={analytics.summaryData[1].percentage}
                    icon={Lock}
                    color="bg-yellow-500"
                  />
                  <MetricCard 
                    title="Inactive Users"
                    value={analytics.summaryData[2].value}
                    percentage={analytics.summaryData[2].percentage}
                    icon={Clock}
                    color="bg-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Donut Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>User Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.donutData}
                              innerRadius="60%"
                              outerRadius="80%"
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {analytics.donutData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-3 border rounded shadow-lg">
                                      <p className="font-medium">{payload[0].name}</p>
                                      <p className="text-sm">Count: {payload[0].value}</p>
                                      <p className="text-sm">
                                        Percentage: {((payload[0].value / analytics.totalUsers) * 100).toFixed(1)}%
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-4 mt-4">
                        {analytics.donutData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: COLORS[index] }}
                            />
                            <span className="text-sm">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly User Creation Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-3 border rounded shadow-lg">
                                      <p className="font-medium">{payload[0].payload.month}</p>
                                      <p className="text-sm">New Users: {payload[0].value}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar 
                              dataKey="count" 
                              fill="#4f46e5"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserAnalyticsDashboard;