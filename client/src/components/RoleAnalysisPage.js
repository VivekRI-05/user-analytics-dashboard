import React, { useState } from 'react';
import RoleAnalytics from './RoleAnalytics';

const RoleAnalysisPage = () => {
  const [riskDataset, setRiskDataset] = useState(null);
  const [inputFile, setInputFile] = useState(null);

  // Add file upload handlers here

  return (
    <div>
      {/* Add file upload UI here */}
      <RoleAnalytics 
        riskDataset={riskDataset}
        inputFile={inputFile}
      />
    </div>
  );
};

export default RoleAnalysisPage; 