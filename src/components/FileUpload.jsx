import React from 'react';
import Papa from 'papaparse';

export const FileUpload = ({ onFileUpload, label }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('File selected:', file.name);
      
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          console.log(`${label} file parsed:`, results.data[0]);
          onFileUpload(results.data);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Error parsing CSV file');
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="file"
        onChange={handleFileChange}
        accept=".csv"
        className="file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-violet-50 file:text-violet-700
                   hover:file:bg-violet-100
                   border rounded-lg text-sm
                   text-gray-500
                   p-2"
      />
    </div>
  );
}; 