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

async function createAdminUser() {
  try {
    const saltRounds = 10;
    
    // Create admin user with full permissions
    const adminUser = {
      username: "Admin",
      email: "admin@company.com",
      password: await bcrypt.hash("admin", saltRounds),
      role: "admin",
      permissions: {
        audit: {
          enabled: true,
          userAnalysis: true,
          roleAnalysis: true,
          combinedAnalysis: true,
          recommendations: true
        },
        userAccessReview: true,
        sorReview: true,
        superUserAccess: true,
        dashboard: true
      }
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { username: 'Admin' } });
    
    if (existingAdmin) {
      // Update existing admin
      await existingAdmin.update(adminUser);
      console.log('Admin user updated successfully');
    } else {
      // Create new admin
      await User.create(adminUser);
      console.log('Admin user created successfully');
    }

  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
createAdminUser(); 