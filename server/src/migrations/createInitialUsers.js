const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const config = require('../config/database').development;

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

async function createInitialUsers() {
  try {
    const saltRounds = 10;
    
    // Create initial users
    const users = [
      {
        username: "db01",
        email: "df@gmail.com",
        password: await bcrypt.hash("Wel@#5&", saltRounds),
        role: "user",
        permissions: {
          audit: {
            enabled: true,
            userAnalysis: true,
            roleAnalysis: false,
            combinedAnalysis: false,
            recommendations: false
          },
          userAccessReview: false,
          dashboard: true
        }
      }
      // Add more users as needed
    ];

    for (const userData of users) {
      await User.create(userData);
      console.log(`Created user: ${userData.username}`);
    }

    console.log('Initial users created successfully');
  } catch (error) {
    console.error('Error creating initial users:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
createInitialUsers(); 