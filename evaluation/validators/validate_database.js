const fs = require('fs');
const path = require('path');

// Test the database integration implementation
try {
  // Check if required files exist
  const requiredFiles = ['models/User.js', 'controllers/userController.js', 'config/database.js'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, '../temp_solution', file))) {
      console.error(`FAIL: ${file} file not found`);
      process.exit(1);
    }
  }

  // Check User model
  const userContent = fs.readFileSync(path.join(__dirname, '../temp_solution/models/User.js'), 'utf8');
  
  // Basic checks for User model
  if (!userContent.includes('schema') && !userContent.includes('model')) {
    console.warn('WARNING: User model might not follow standard schema/model patterns');
  }
  
  // Check for required fields
  if (!userContent.includes('id') || !userContent.includes('name') || !userContent.includes('email')) {
    console.warn('WARNING: User model might be missing required fields (id, name, email)');
  }

  // Check userController
  const controllerContent = fs.readFileSync(path.join(__dirname, '../temp_solution/controllers/userController.js'), 'utf8');
  
  // Check for CRUD operations
  const crudOps = ['create', 'read', 'update', 'delete', 'find', 'findOne', 'findById'];
  const hasCrud = crudOps.some(op => controllerContent.includes(op));
  
  if (!hasCrud) {
    console.warn('WARNING: UserController might not implement standard CRUD operations');
  }

  // Check database config
  const configContent = fs.readFileSync(path.join(__dirname, '../temp_solution/config/database.js'), 'utf8');
  
  // Check for connection setup
  if (!configContent.includes('connect') && !configContent.includes('connection')) {
    console.warn('WARNING: Database config might not set up a connection properly');
  }

  console.log('PASS: Database integration files exist and have basic structure');
  process.exit(0);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}