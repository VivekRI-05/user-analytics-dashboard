const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Enable CORS
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Add logging middleware
server.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Add error handling
server.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Add custom routes for user management
server.post('/users', (req, res, next) => {
  try {
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Ensure dashboard permission is enabled for new users
    const userData = {
      ...req.body,
      permissions: {
        ...req.body.permissions,
        dashboard: true // Always set dashboard to true
      }
    };

    // Modify the request body
    req.body = userData;
    next();
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Add middleware to ensure dashboard access on user updates
server.put('/users/:id', (req, res, next) => {
  try {
    // Ensure dashboard permission remains enabled on updates
    const userData = {
      ...req.body,
      permissions: {
        ...req.body.permissions,
        dashboard: true // Always keep dashboard enabled
      }
    };

    // Modify the request body
    req.body = userData;
    next();
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Initialize or update existing users
const initializeUsers = async () => {
  try {
    const db = router.db; // Get the lowdb instance
    const users = db.get('users').value();

    // Update all existing users to have dashboard access
    const updatedUsers = users.map(user => ({
      ...user,
      permissions: {
        ...user.permissions,
        dashboard: true
      }
    }));

    // Write back to db.json
    db.set('users', updatedUsers).write();
    console.log('Successfully updated all users with dashboard access');
  } catch (error) {
    console.error('Error initializing users:', error);
  }
};

// Call initialization when server starts
initializeUsers();

// Add endpoint to upload role input file
server.post('/api/upload-roles', jsonServer.bodyParser, (req, res) => {
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
server.post('/api/upload-dataset', jsonServer.bodyParser, (req, res) => {
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

server.use(router);

const port = 3001;
server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
}); 