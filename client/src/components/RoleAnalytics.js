import React, { useState, useEffect, useMemo } from "react";
import { FileUpload } from "./FileUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const RoleAnalytics = () => {
  const [riskDataset, setRiskDataset] = useState(null);
  const [inputFile, setInputFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRole, setSelectedRole] = useState("all");

  const handleRiskFileUpload = (data) => {
    console.log('Setting risk dataset');
    setRiskDataset(data);
  };

  const handleInputFileUpload = (data) => {
    console.log('Setting input file');
    setInputFile(data);
  };

  useEffect(() => {
    const hasRiskDataset = !!riskDataset?.length;
    const hasInputFile = !!inputFile?.length;
    
    console.log('useEffect triggered', { hasRiskDataset, hasInputFile });

    if (hasRiskDataset && hasInputFile) {
      console.log('Both files loaded, starting analysis');
      console.log('Risk Dataset first row:', riskDataset[0]);
      console.log('Input File first row:', inputFile[0]);

      const results = analyzeRisks(riskDataset, inputFile);
      setAnalysisResults(results);
    }
  }, [riskDataset, inputFile]);

  const analyzeRisks = (riskData, roleData) => {
    const DEBUG = false;
    const debug = (...args) => {
      if (DEBUG) console.log(...args);
    };

    // Create hierarchical data structures
    const sodRiskToFunctions = new Map(); // SoD Risk ID -> Set of Function IDs
    const criticalRiskToFunction = new Map(); // Critical Risk ID -> Function ID
    const functionToActions = new Map(); // Function ID -> Set of Actions
    const roleToActions = new Map(); // Role -> Set of Actions
    const finalRisks = [];

    // Step 1: Build Risk mappings based on risk type
    riskData.forEach(risk => {
      if (!risk['Risk ID'] || !risk['Function ID']) return;

      if (risk['Risk Type'] === 'Segregation of Duties') {
        // Handle SoD risks
        if (!sodRiskToFunctions.has(risk['Risk ID'])) {
          sodRiskToFunctions.set(risk['Risk ID'], {
            functions: new Set(),
            description: risk.Description || '',
            riskLevel: risk['Risk Level'] || '',
            riskType: risk['Risk Type']
          });
        }
        sodRiskToFunctions.get(risk['Risk ID']).functions.add(risk['Function ID']);
      } 
      else if (risk['Risk Type'] === 'Critical Action') {
        // Handle Critical Action risks
        if (!criticalRiskToFunction.has(risk['Risk ID'])) {
          criticalRiskToFunction.set(risk['Risk ID'], {
            functionId: risk['Function ID'],
            description: risk.Description || '',
            riskLevel: risk['Risk Level'] || '',
            riskType: risk['Risk Type']
          });
        }
      }
    });

    // Step 2: Build Function -> Action mappings
    riskData.forEach(risk => {
      if (risk['Function ID'] && risk.Action) {
        if (!functionToActions.has(risk['Function ID'])) {
          functionToActions.set(risk['Function ID'], {
            actions: new Set(),
            description: risk['Function Description'] || ''
          });
        }
        functionToActions.get(risk['Function ID']).actions.add(risk.Action.toUpperCase());
      }
    });

    // Step 3: Build Role -> Action mappings
    roleData.forEach(role => {
      if (role['Final Placement'] && role.Action) {
        if (!roleToActions.has(role['Final Placement'])) {
          roleToActions.set(role['Final Placement'], new Set());
        }
        roleToActions.get(role['Final Placement']).add(role.Action.toUpperCase());
      }
    });

    // Helper function to find matching actions
    const getMatchingActions = (functionId, roleActions) => {
      const functionInfo = functionToActions.get(functionId);
      if (!functionInfo) return [];
      return Array.from(functionInfo.actions)
        .filter(action => roleActions.has(action));
    };

    // Step 4: Analyze roles for both risk types
    roleToActions.forEach((roleActions, roleName) => {
      debug(`Analyzing role: ${roleName}`);

      // Check Critical Action risks
      criticalRiskToFunction.forEach((riskInfo, riskId) => {
        const matchingActions = getMatchingActions(riskInfo.functionId, roleActions);
        
        if (matchingActions.length > 0) {
          debug(`Found Critical Action risk ${riskId} for role ${roleName}`);
          finalRisks.push({
            riskId: riskId,
            role: roleName,
            description: riskInfo.description,
            riskLevel: riskInfo.riskLevel,
            riskType: 'Critical Action',
            functions: `${riskInfo.functionId} (${matchingActions.join(', ')})`
          });
        }
      });

      // Check Segregation of Duties risks
      sodRiskToFunctions.forEach((riskInfo, riskId) => {
        let hasAllFunctions = true;
        const conflictingFunctions = [];
        
        for (const functionId of riskInfo.functions) {
          const matchingActions = getMatchingActions(functionId, roleActions);
          if (matchingActions.length === 0) {
            hasAllFunctions = false;
            break;
          }
          conflictingFunctions.push(`${functionId} (${matchingActions.join(', ')})`);
        }

        if (hasAllFunctions) {
          debug(`Found SoD risk ${riskId} for role ${roleName}`);
          finalRisks.push({
            riskId: riskId,
            role: roleName,
            description: riskInfo.description,
            riskLevel: riskInfo.riskLevel,
            riskType: 'Segregation of Duties',
            functions: conflictingFunctions.join(', ')
          });
        }
      });
    });

    const sodRisks = finalRisks.filter(r => r.riskType === 'Segregation of Duties');
    const criticalRisks = finalRisks.filter(r => r.riskType === 'Critical Action');

    console.log(`Analysis complete.`);
    console.log(`Found ${sodRisks.length} SoD risks and ${criticalRisks.length} Critical Action risks`);
    console.log(`Analyzed ${sodRiskToFunctions.size} unique SoD risks and ${criticalRiskToFunction.size} Critical Action risks`);

    return {
      finalRisks,
      roleAnalysis: roleToActions,
      summary: {
        uniqueSoDRisks: sodRiskToFunctions.size,
        uniqueCriticalRisks: criticalRiskToFunction.size,
        totalRisks: finalRisks.length,
        totalRoles: roleToActions.size,
        sodRisks: sodRisks.length,
        criticalRisks: criticalRisks.length
      }
    };
  };

  const filteredRisks = useMemo(() => {
    if (!analysisResults?.finalRisks) return [];
    let risks = analysisResults.finalRisks;
    if (selectedRole !== "all") {
      risks = risks.filter(risk => risk.role === selectedRole);
    }
    return risks;
  }, [analysisResults?.finalRisks, selectedRole]);

  const paginatedRisks = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredRisks.slice(start, end);
  }, [filteredRisks, page, pageSize]);

  const totalPages = Math.ceil(filteredRisks.length / pageSize);

  const getDashboardMetrics = (risks) => {
    // Process risks by business process
    const businessProcessMap = new Map();
    risks.forEach(risk => {
      const process = risk.description.split('-')[0].trim();
      businessProcessMap.set(process, (businessProcessMap.get(process) || 0) + 1);
    });

    // Process risks by role
    const roleMap = new Map();
    risks.forEach(risk => {
      roleMap.set(risk.role, (roleMap.get(risk.role) || 0) + 1);
    });

    // Process risks by risk level
    const riskLevelMap = new Map();
    risks.forEach(risk => {
      riskLevelMap.set(risk.riskLevel, (riskLevelMap.get(risk.riskLevel) || 0) + 1);
    });

    // Process risks by type
    const riskTypeMap = new Map();
    risks.forEach(risk => {
      riskTypeMap.set(risk.riskType, (riskTypeMap.get(risk.riskType) || 0) + 1);
    });

    // Process risks by function
    const functionMap = new Map();
    risks.forEach(risk => {
      const functions = risk.functions.split(',').map(f => f.split('(')[0].trim());
      functions.forEach(func => {
        functionMap.set(func, (functionMap.get(func) || 0) + 1);
      });
    });

    // Calculate percentages
    const totalRisks = risks.length;
    const riskLevelPercentages = Array.from(riskLevelMap.entries()).map(([level, count]) => ({
      name: level,
      value: count,
      percentage: ((count / totalRisks) * 100).toFixed(1)
    }));

    const riskTypePercentages = Array.from(riskTypeMap.entries()).map(([type, count]) => ({
      name: type,
      value: count,
      percentage: ((count / totalRisks) * 100).toFixed(1)
    }));

    return {
      byBusinessProcess: Array.from(businessProcessMap, ([name, value]) => ({ name, value })),
      byRole: Array.from(roleMap, ([name, value]) => ({ name, value })),
      byRiskLevel: riskLevelPercentages,
      byRiskType: riskTypePercentages,
      byFunction: Array.from(functionMap, ([name, value]) => ({ name, value })),
      summary: {
        totalRisks,
        totalRoles: roleMap.size,
        totalBusinessProcesses: businessProcessMap.size,
        totalFunctions: functionMap.size,
        highestRiskRole: Array.from(roleMap.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0],
        mostAffectedProcess: Array.from(businessProcessMap.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      }
    };
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <FileUpload
            onFileUpload={handleRiskFileUpload}
            label="Upload Risk Dataset"
          />
          <FileUpload
            onFileUpload={handleInputFileUpload}
            label="Upload Input File"
          />
        </div>

        {analysisResults && (
          <>
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-bold mb-4">Risk Analytics Dashboard</h2>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-600">Total Risks</h3>
                  <p className="text-2xl font-bold">{getDashboardMetrics(filteredRisks).summary.totalRisks}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-600">Business Processes</h3>
                  <p className="text-2xl font-bold">{getDashboardMetrics(filteredRisks).summary.totalBusinessProcesses}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-600">Total Functions</h3>
                  <p className="text-2xl font-bold">{getDashboardMetrics(filteredRisks).summary.totalFunctions}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-600">Affected Roles</h3>
                  <p className="text-2xl font-bold">{getDashboardMetrics(filteredRisks).summary.totalRoles}</p>
                </div>
              </div>

              {/* Risk Distribution */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Risk Level Distribution</h3>
                  <div className="flex items-center justify-between mb-4">
                    {getDashboardMetrics(filteredRisks).byRiskLevel.map((level, index) => (
                      <div key={index} className="text-center">
                        <p className="text-lg font-bold">{level.percentage}%</p>
                        <p className="text-sm text-gray-600">{level.name}</p>
                      </div>
                    ))}
                  </div>
                  <PieChart width={300} height={200}>
                    <Pie
                      data={getDashboardMetrics(filteredRisks).byRiskLevel}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {getDashboardMetrics(filteredRisks).byRiskLevel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#10B981'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Top Affected Functions</h3>
                  <BarChart
                    width={300}
                    height={200}
                    data={getDashboardMetrics(filteredRisks).byFunction.slice(0, 5)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366F1" />
                  </BarChart>
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-medium mb-2">Key Insights</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Most Affected Role</p>
                    <p className="text-lg font-bold">{getDashboardMetrics(filteredRisks).summary.highestRiskRole}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Most Affected Process</p>
                    <p className="text-lg font-bold">{getDashboardMetrics(filteredRisks).summary.mostAffectedProcess}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Role Risk Analysis</h2>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => {
                    setSelectedRole(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {Array.from(analysisResults.roleAnalysis?.keys() || []).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-2 text-left">Risk ID</th>
                      <th className="border p-2 text-left">Risk Type</th>
                      <th className="border p-2 text-left">Role</th>
                      <th className="border p-2 text-left">Functions (Actions)</th>
                      <th className="border p-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRisks.map((risk, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border p-2">{risk.riskId}</td>
                        <td className="border p-2">{risk.riskType}</td>
                        <td className="border p-2">{risk.role}</td>
                        <td className="border p-2">{risk.functions}</td>
                        <td className="border p-2">{risk.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Showing {paginatedRisks.length} of {filteredRisks.length} results
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-bold text-lg mb-2">Analysis Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Risks Found</p>
                    <p className="text-2xl font-bold">{filteredRisks.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">SoD Risks</p>
                    <p className="text-2xl font-bold">
                      {filteredRisks.filter(r => r.riskType === 'Segregation of Duties').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Critical Action Risks</p>
                    <p className="text-2xl font-bold">
                      {filteredRisks.filter(r => r.riskType === 'Critical Action').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoleAnalytics; 