import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const RoleRiskAnalysis = () => {
  const [riskDataset, setRiskDataset] = useState(null);
  const [inputFile, setInputFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedRole, setSelectedRole] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const handleRiskFileUpload = (data) => {
    console.log('Setting risk dataset');
    setRiskDataset(data);
  };

  const handleInputFileUpload = (data) => {
    console.log('Setting input file');
    setInputFile(data);
  };

  // Calculate paginated risks
  const filteredRisks = React.useMemo(() => {
    if (!analysisResults?.finalRisks) return [];
    return analysisResults.finalRisks.filter(risk => 
      selectedRole === "all" || risk.role === selectedRole
    );
  }, [analysisResults, selectedRole]);

  const totalPages = Math.ceil(filteredRisks.length / pageSize);
  const paginatedRisks = filteredRisks.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

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
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleRiskAnalysis; 