export const functionRiskDataset = {
  // Sample data structure based on your fields
  RISK001: {
    description: "Unauthorized payment processing",
    riskLevel: "high",
    riskType: "financial",
    functions: {
      FUNC001: {
        description: "Create Payment",
        businessProcess: "Payment Processing",
        action: "create",
        conflictsWith: ["FUNC002"]
      },
      FUNC002: {
        description: "Approve Payment",
        businessProcess: "Payment Processing",
        action: "approve",
        conflictsWith: ["FUNC001"]
      }
    }
  },
  RISK002: {
    description: "Unauthorized system access",
    riskLevel: "critical",
    riskType: "access_control",
    functions: {
      FUNC003: {
        description: "Create User Account",
        businessProcess: "User Management",
        action: "create",
        conflictsWith: ["FUNC004"]
      },
      FUNC004: {
        description: "Approve User Access",
        businessProcess: "User Management",
        action: "approve",
        conflictsWith: ["FUNC003"]
      }
    }
  }
  // Add more risk entries as needed
};

export const riskLevels = {
  low: { color: '#10B981', weight: 1 },
  medium: { color: '#F59E0B', weight: 2 },
  high: { color: '#EF4444', weight: 3 },
  critical: { color: '#7F1D1D', weight: 4 }
};

// Function to load dataset from CSV
export const loadDatasetFromCSV = (csvContent) => {
  const rows = csvContent.split('\n').slice(1); // Skip header
  const dataset = {};

  rows.forEach(row => {
    const [
      riskId,
      description,
      riskLevel,
      riskType,
      functionId,
      functionDescription,
      businessProcess,
      action
    ] = row.split(',').map(field => field.trim());

    if (!dataset[riskId]) {
      dataset[riskId] = {
        description,
        riskLevel,
        riskType,
        functions: {}
      };
    }

    dataset[riskId].functions[functionId] = {
      description: functionDescription,
      businessProcess,
      action,
      conflictsWith: [] // Will be populated based on business rules
    };
  });

  return dataset;
}; 