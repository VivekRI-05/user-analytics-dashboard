import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Upload, Download } from 'lucide-react';
import { riskLevels } from '../data/roleDataset';

const RoleAnalytics = ({ dataset }) => {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  const calculateRiskScore = (risks) => {
    const weights = { low: 1, medium: 2, high: 3, critical: 4 };
    return risks.reduce((score, risk) => score + weights[risk.riskLevel], 0);
  };

  const analyzeRoles = (csvContent) => {
    try {
      console.log('Input CSV Content:', csvContent);
      const rows = csvContent.split('\n').slice(1);
      const analysis = {
        roleRisks: {},
        riskCounts: { low: 0, medium: 0, high: 0, critical: 0 },
        businessProcessRisks: {},
        topRiskyRoles: [],
        totalRoles: 0,
        atRiskRoles: 0
      };

      rows.forEach(row => {
        if (!row.trim()) return;
        
        const [role, inputAction] = row.split(',').map(field => field.trim());
        console.log('Processing Role:', role, 'Action:', inputAction);
        
        analysis.totalRoles++;
        const roleAnalysis = {
          functions: [],
          risks: [],
          riskScore: 0,
          businessProcesses: new Set(),
          conflictingActions: []
        };

        // Dataset columns: [RiskID, Description, RiskLevel, RiskType, FunctionID, FunctionDescription, BusinessProcess, Action]
        Object.entries(dataset).forEach(([_, riskData]) => {
          // Check if action matches
          if (riskData.Action === inputAction) {
            console.log('Match found:', {
              role,
              inputAction,
              riskId: riskData.RiskID,
              functionId: riskData.FunctionID,
              riskLevel: riskData.RiskLevel,
              businessProcess: riskData.BusinessProcess
            });

            roleAnalysis.functions.push({
              id: riskData.FunctionID,
              description: riskData.FunctionDescription,
              businessProcess: riskData.BusinessProcess,
              action: riskData.Action
            });

            roleAnalysis.risks.push({
              id: riskData.RiskID,
              description: riskData.Description,
              riskLevel: riskData.RiskLevel,
              riskType: riskData.RiskType
            });

            roleAnalysis.businessProcesses.add(riskData.BusinessProcess);

            // Update risk counts
            analysis.riskCounts[riskData.RiskLevel.toLowerCase()]++;
          }
        });

        // Calculate risk score after all matches are found
        roleAnalysis.riskScore = calculateRiskScore(roleAnalysis.risks);

        if (roleAnalysis.risks.length > 0) {
          analysis.atRiskRoles++;
        }

        console.log('Role Analysis Result:', {
          role,
          riskScore: roleAnalysis.riskScore,
          risksFound: roleAnalysis.risks.length,
          businessProcesses: Array.from(roleAnalysis.businessProcesses),
          functions: roleAnalysis.functions.length
        });

        analysis.roleRisks[role] = roleAnalysis;
      });

      // Sort and set top risky roles
      analysis.topRiskyRoles = Object.entries(analysis.roleRisks)
        .map(([role, data]) => ({
          role,
          riskScore: data.riskScore,
          conflictCount: data.conflictingActions.length,
          businessProcessCount: data.businessProcesses.size
        }))
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

      console.log('Final Analysis:', {
        totalRoles: analysis.totalRoles,
        atRiskRoles: analysis.atRiskRoles,
        riskCounts: analysis.riskCounts,
        topRiskyRoles: analysis.topRiskyRoles.slice(0, 3),
        businessProcesses: Object.keys(analysis.businessProcessRisks).length
      });

      return analysis;
    } catch (err) {
      console.error('Analysis Error:', err);
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
        const results = analyzeRoles(text);
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
        totalRoles: Object.keys(analytics.roleRisks).length,
        totalConflicts: analytics.conflicts.length,
        riskCounts: analytics.riskCounts,
        businessProcessRisks: analytics.businessProcessRisks
      },
      detailedAnalysis: analytics.roleRisks,
      conflicts: analytics.conflicts
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'role-analysis-report.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Role Analysis Dashboard</CardTitle>
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
            <span className="text-sm text-gray-500">Upload Role CSV file</span>
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
                  <h3 className="font-semibold">Total Roles</h3>
                  <p className="text-2xl">{analytics.totalRoles}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold">At-Risk Roles</h3>
                  <p className="text-2xl">{analytics.atRiskRoles}</p>
                  <p className="text-sm text-gray-500">
                    ({((analytics.atRiskRoles / analytics.totalRoles) * 100).toFixed(1)}%)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold">Critical Risk Roles</h3>
                  <p className="text-2xl">{analytics.riskCounts.critical}</p>
                </CardContent>
              </Card>
            </div>

            {/* Top 10 Risky Roles */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 High-Risk Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Role</th>
                        <th className="px-4 py-2">Risk Score</th>
                        <th className="px-4 py-2">Conflicts</th>
                        <th className="px-4 py-2">Business Processes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topRiskyRoles.map((role, index) => (
                        <tr key={role.role} className={index % 2 ? 'bg-gray-50' : ''}>
                          <td className="px-4 py-2">{role.role}</td>
                          <td className="px-4 py-2">{role.riskScore}</td>
                          <td className="px-4 py-2">{role.conflictCount}</td>
                          <td className="px-4 py-2">{role.businessProcessCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Business Process Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Business Process Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(analytics.businessProcessRisks).map(([process, data]) => ({
                        name: process,
                        ...data.byRiskLevel,
                        total: data.total
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="critical" stackId="a" fill={riskLevels.critical.color} />
                      <Bar dataKey="high" stackId="a" fill={riskLevels.high.color} />
                      <Bar dataKey="medium" stackId="a" fill={riskLevels.medium.color} />
                      <Bar dataKey="low" stackId="a" fill={riskLevels.low.color} />
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
                Download Detailed Report
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleAnalytics; 