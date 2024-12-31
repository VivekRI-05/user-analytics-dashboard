import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { ArrowLeft, Upload } from 'lucide-react';
import RoleAnalytics from './RoleAnalytics';
import { loadDatasetFromCSV } from '../data/roleDataset';

const RoleAnalysisPage = () => {
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [error, setError] = useState(null);
  const [isDatasetLoaded, setIsDatasetLoaded] = useState(false);

  const handleDatasetUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedDataset = loadDatasetFromCSV(e.target.result);
          setDataset(loadedDataset);
          setIsDatasetLoaded(true);
          setError(null);
        } catch (err) {
          setError('Error processing dataset file. Please check the format.');
        }
      };
      reader.onerror = () => {
        setError('Error reading the file. Please try again.');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Role Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isDatasetLoaded ? (
            <div className="mb-6">
              <label className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <span className="text-sm text-gray-500">Upload Risk Dataset CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleDatasetUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <Alert className="mb-6">
              <AlertTitle>Dataset Loaded Successfully</AlertTitle>
              <AlertDescription>
                You can now proceed with role analysis.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isDatasetLoaded && (
        <RoleAnalytics dataset={dataset} />
      )}
    </div>
  );
};

export default RoleAnalysisPage; 