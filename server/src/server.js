const express = require('express');
const { Sequelize } = require('sequelize');
const cors = require('cors');
const bcrypt = require('bcrypt');
const config = require('./config/database').development;

const app = express();
const saltRounds = 10; // for bcrypt

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: 'postgres',
    logging: false // Set to true for SQL query logging
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

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Routes
app.post('/users', async (req, res) => {
  try {
    console.log('Received user data:', req.body);
    
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const userData = {
      ...req.body,
      password: hashedPassword
    };
    
    // Create user with hashed password
    const user = await User.create(userData, { logging: console.log });
    console.log('Created user in database:', user.toJSON());
    
    // Return user data without password
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.update(req.body);
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add endpoint to upload role input file
app.post('/api/upload-roles', express.json(), (req, res) => {
  try {
    const inputRoles = req.body;
    
    // Validate input format (2 columns)
    if (!Array.isArray(inputRoles) || inputRoles.some(row => !Array.isArray(row) || row.length !== 2)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid input format. Each row must have exactly 2 columns: Role and Action' 
      });
    }

    // Save to db.json
    router.db.set('inputRoles', inputRoles).write();
    res.json({ 
      success: true, 
      message: 'Roles uploaded successfully',
      count: inputRoles.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add endpoint to upload risk dataset
app.post('/api/upload-dataset', express.json(), (req, res) => {
  try {
    const riskDataset = req.body;
    
    // Validate dataset format (8 columns)
    if (!Array.isArray(riskDataset) || riskDataset.some(row => !Array.isArray(row) || row.length !== 8)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid dataset format. Each row must have exactly 8 columns' 
      });
    }

    // Save to db.json
    router.db.set('riskDataset', riskDataset).write();
    res.json({ 
      success: true, 
      message: 'Dataset uploaded successfully',
      count: riskDataset.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update login route with detailed logging
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt details:', {
      attemptedUsername: username,
      attemptedPassword: password
    });

    // Find user by username
    const user = await User.findOne({ 
      where: { username: username }
    });

    console.log('Database lookup result:', {
      userFound: !!user,
      storedDetails: user ? {
        username: user.username,
        storedPassword: user.password,
        role: user.role
      } : null
    });

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    // Direct password comparison
    const exactMatch = user.password === password;
    console.log('Exact password match:', exactMatch);

    // Bcrypt comparison
    const bcryptMatch = await bcrypt.compare(password, user.password);
    console.log('Bcrypt password match:', bcryptMatch);

    if (!exactMatch && !bcryptMatch) {
      console.log('Login failed: Password mismatch');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    // Send user data (excluding password)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    console.log('Login successful for user:', username);
    res.json({ 
      success: true, 
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add this route temporarily for debugging
app.get('/debug-users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['username', 'email', 'password', 'role', 'permissions']
    });
    console.log('All users in database:', users.map(u => u.toJSON()));
    res.json(users);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Database connection and server start
const port = process.env.PORT || 8001;

async function startServer() {
  try {
    // Sync database WITHOUT force: true to preserve data
    await sequelize.sync(); // Remove force: true
    console.log('Database synced successfully');

    // Start server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

startServer(); 

