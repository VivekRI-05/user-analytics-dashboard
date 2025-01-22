import React, { useState, useEffect } from 'react';

const RiskMappingComponent = () => {
    const [mappedResults, setMappedResults] = useState([]);

    useEffect(() => {
        // Function to load and process CSV files
        const processFiles = async () => {
            try {
                const response = await fetch('/api/process-risk-mapping', {
                    method: 'POST',
                    body: JSON.stringify({
                        inputFile: 'path/to/input.csv',
                        datasetFile: 'path/to/dataset.csv'
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                setMappedResults(data);
            } catch (error) {
                console.error('Error processing files:', error);
            }
        };

        processFiles();
    }, []);

    return (
        <div>
            <h2>Risk Mapping Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Final Placement</th>
                        <th>Risk ID</th>
                    </tr>
                </thead>
                <tbody>
                    {mappedResults.map((result, index) => (
                        <tr key={index}>
                            <td>{result.FinalPlacement}</td>
                            <td>{result.RiskID}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RiskMappingComponent; 