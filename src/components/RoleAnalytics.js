import React, { useState, useEffect, useMemo } from "react";
import { FileUpload } from "./FileUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

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
    const riskToFunctions = new Map(); // Risk ID -> Set of Function IDs
    const functionToActions = new Map(); // Function ID -> Set of Actions
    const roleToActions = new Map(); // Role -> Set of Actions
    const finalRisks = [];

    // Step 1: Build Risk -> Function mappings (Column A -> Column E)
    riskData.forEach(risk => {
      if (risk['Risk ID'] && risk['Function ID']) {
        if (!riskToFunctions.has(risk['Risk ID'])) {
          riskToFunctions.set(risk['Risk ID'], {
            functions: new Set(),
            description: risk.Description || '',
            riskLevel: risk['Risk Level'] || '',
            riskType: risk['Risk Type'] || ''
          });
        }
        riskToFunctions.get(risk['Risk ID']).functions.add(risk['Function ID']);
      }
    });

    // Step 2: Build Function -> Action mappings (Column E -> Column H)
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

    // Step 3: Build Role -> Action mappings from input file
    roleData.forEach(role => {
      if (role['Final Placement'] && role.Action) {
        if (!roleToActions.has(role['Final Placement'])) {
          roleToActions.set(role['Final Placement'], new Set());
        }
        roleToActions.get(role['Final Placement']).add(role.Action.toUpperCase());
      }
    });

    // Helper function to find matching actions between role and function
    const getMatchingActions = (functionId, roleActions) => {
      const functionInfo = functionToActions.get(functionId);
      if (!functionInfo) return [];
      
      return Array.from(functionInfo.actions)
        .filter(action => roleActions.has(action));
    };

    // Step 4: Analyze risks against roles
    roleToActions.forEach((roleActions, roleName) => {
      debug(`Analyzing role: ${roleName} with actions:`, Array.from(roleActions));

      riskToFunctions.forEach((riskInfo, riskId) => {
        // Check if role has ANY action for each required function
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
          debug(`Found risk ${riskId} for role ${roleName}`);
          finalRisks.push({
            riskId: riskId,
            role: roleName,
            description: riskInfo.description,
            riskLevel: riskInfo.riskLevel,
            riskType: riskInfo.riskType,
            functions: conflictingFunctions.join(', ')
          });
        }
      });
    });

    console.log(`Analysis complete. Found ${finalRisks.length} risks across ${roleToActions.size} roles.`);
    console.log(`Analyzed ${riskToFunctions.size} unique risks.`);

    return {
      finalRisks,
      roleAnalysis: roleToActions,
      summary: {
        uniqueRisks: riskToFunctions.size,
        totalRisks: finalRisks.length,
        totalRoles: roleToActions.size
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

  return (
    <div className="container mx-auto p-4">
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
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
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Analysis Results</h2>
              <Select
                value={selectedRole}
                onValueChange={(value) => {
                  setSelectedRole(value);
                  setPage(1); // Reset to first page when filter changes
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
                    <th className="border p-2 text-left">Role</th>
                    <th className="border p-2 text-left">Action</th>
                    <th className="border p-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRisks.map((risk, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border p-2">{risk.riskId}</td>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Conflicts Found</p>
                  <p className="text-2xl font-bold">{filteredRisks.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Roles Analyzed</p>
                  <p className="text-2xl font-bold">{analysisResults.roleAnalysis?.size || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleAnalytics; 