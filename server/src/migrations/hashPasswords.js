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

async function hashExistingPasswords() {
  try {
    const users = await User.findAll();
    const saltRounds = 10;

    for (const user of users) {
      // Hash the existing password
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      
      // Update the user with hashed password
      await user.update({ password: hashedPassword });
      
      console.log(`Updated password for user: ${user.username}`);
    }

    console.log('All passwords have been hashed successfully');
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
hashExistingPasswords(); 