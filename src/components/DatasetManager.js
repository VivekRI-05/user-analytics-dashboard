import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Upload } from 'lucide-react';
import { loadDatasetFromCSV } from '../data/roleDataset';

const DatasetManager = ({ onDatasetLoad }) => {
  const [error, setError] = useState(null);

  const handleDatasetUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const dataset = loadDatasetFromCSV(e.target.result);
          onDatasetLoad(dataset);
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
    <Card>
      <CardHeader>
        <CardTitle>Load Risk Dataset</CardTitle>
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
          <span className="text-sm text-gray-500">Upload Dataset CSV</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleDatasetUpload}
            className="hidden"
          />
        </label>
      </CardContent>
    </Card>
  );
};

export default DatasetManager; 