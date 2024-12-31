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
      const rows = csvContent.split('\n').slice(1);
      const analysis = {
        roleRisks: {},
        riskCounts: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        businessProcessRisks: {},
        topRiskyRoles: [],
        totalRoles: 0,
        atRiskRoles: 0
      };

      // Process each role
      rows.forEach(row => {
        if (!row.trim()) return;
        
        const [role, functionIds] = row.split(',').map(field => field.trim());
        const functions = functionIds.split(';');
        
        analysis.totalRoles++;
        const roleAnalysis = {
          functions: [],
          risks: [],
          riskScore: 0,
          businessProcesses: new Set(),
          conflictingActions: []
        };

        // Analyze functions and their associated risks
        functions.forEach(funcId => {
          Object.entries(dataset).forEach(([riskId, riskData]) => {
            if (riskData.functions[funcId]) {
              const func = riskData.functions[funcId];
              
              // Track function and risk details
              roleAnalysis.functions.push({
                id: funcId,
                ...func,
                riskId,
                riskLevel: riskData.riskLevel
              });

              roleAnalysis.risks.push({
                id: riskId,
                description: riskData.description,
                riskLevel: riskData.riskLevel,
                riskType: riskData.riskType
              });

              roleAnalysis.businessProcesses.add(func.businessProcess);

              // Check for conflicting actions within the same business process
              functions.forEach(otherFuncId => {
                if (funcId !== otherFuncId && riskData.functions[otherFuncId]) {
                  const otherFunc = riskData.functions[otherFuncId];
                  if (
                    func.businessProcess === otherFunc.businessProcess &&
                    func.action === otherFunc.action
                  ) {
                    roleAnalysis.conflictingActions.push({
                      process: func.businessProcess,
                      action: func.action,
                      functions: [funcId, otherFuncId]
                    });
                  }
                }
              });
            }
          });
        });

        // Calculate role risk score
        roleAnalysis.riskScore = calculateRiskScore(roleAnalysis.risks);
        
        // Determine overall role risk level
        const riskLevel = 
          roleAnalysis.riskScore >= 10 ? 'critical' :
          roleAnalysis.riskScore >= 7 ? 'high' :
          roleAnalysis.riskScore >= 4 ? 'medium' : 'low';

        // Update risk counts
        analysis.riskCounts[riskLevel]++;
        
        // Track at-risk roles (medium or higher)
        if (riskLevel !== 'low') {
          analysis.atRiskRoles++;
        }

        // Update business process risks
        roleAnalysis.businessProcesses.forEach(process => {
          if (!analysis.businessProcessRisks[process]) {
            analysis.businessProcessRisks[process] = {
              total: 0,
              byRiskLevel: { low: 0, medium: 0, high: 0, critical: 0 }
            };
          }
          analysis.businessProcessRisks[process].total++;
          analysis.businessProcessRisks[process].byRiskLevel[riskLevel]++;
        });

        analysis.roleRisks[role] = roleAnalysis;
      });

      // Calculate top 10 risky roles
      analysis.topRiskyRoles = Object.entries(analysis.roleRisks)
        .map(([role, data]) => ({
          role,
          riskScore: data.riskScore,
          conflictCount: data.conflictingActions.length,
          businessProcessCount: data.businessProcesses.size
        }))
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

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