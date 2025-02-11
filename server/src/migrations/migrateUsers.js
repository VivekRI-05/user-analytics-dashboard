const { Sequelize } = require('sequelize');
const config = require('../config/database').development;

// Your existing users data
const existingUsers = [
  {
    "username": "db01",
    "email": "df@gmail.com",
    "password": "Jkahd j",
    "role": "user",
    "permissions": {
        "audit": {
            "enabled": false,
            "userAnalysis": false,
            "roleAnalysis": false,
            "combinedAnalysis": false,
            "recommendations": false
        },
        "userAccessReview": false,
        "dashboard": true
    }
  }
  // Add all your existing users here
];

// Initialize Sequelize
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: 'postgres',
    logging: false
  }
);

// Define User model
const User = sequelize.define('User', {
  username: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.STRING,
    defaultValue: 'user'
  },
  permissions: {
    type: Sequelize.JSONB,
    defaultValue: {
      audit: {
        enabled: false,
        userAnalysis: false,
        roleAnalysis: false,
        combinedAnalysis: false,
        recommendations: false
      },
      userAccessReview: false,
      dashboard: true
    }
  }
});

// Migration function
async function migrateUsers() {
  try {
    // Create users in database
    for (const userData of existingUsers) {
      await User.create(userData);
      console.log(`Migrated user: ${userData.username}`);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run migration
migrateUsers(); 