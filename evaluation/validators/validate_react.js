const fs = require('fs');
const path = require('path');

// Test the React component implementation
try {
  // Check if required files exist
  const requiredFiles = ['components/ItemList.js', 'components/SearchBar.js'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, '../temp_solution', file))) {
      console.error(`FAIL: ${file} file not found`);
      process.exit(1);
    }
  }

  // Check ItemList component
  const itemListContent = fs.readFileSync(path.join(__dirname, '../temp_solution/components/ItemList.js'), 'utf8');
  
  // Basic checks for ItemList component
  if (!itemListContent.includes('import') || !itemListContent.includes('export')) {
    console.error('FAIL: ItemList.js should be a valid React component module');
    process.exit(1);
  }
  
  if (!itemListContent.includes('props') && !itemListContent.includes('useState')) {
    console.warn('WARNING: ItemList component might not handle props or state correctly');
  }

  // Check SearchBar component
  const searchBarContent = fs.readFileSync(path.join(__dirname, '../temp_solution/components/SearchBar.js'), 'utf8');
  
  // Basic checks for SearchBar component
  if (!searchBarContent.includes('import') || !searchBarContent.includes('export')) {
    console.error('FAIL: SearchBar.js should be a valid React component module');
    process.exit(1);
  }
  
  if (!searchBarContent.includes('input') || !searchBarContent.includes('onChange')) {
    console.warn('WARNING: SearchBar component might not have proper input handling');
  }

  // Check for basic React patterns
  if (!itemListContent.includes('React') && !searchBarContent.includes('React')) {
    // Check for functional component syntax
    const hasFunctionalSyntax = (itemListContent.includes('=>') || itemListContent.includes('function')) &&
                               (searchBarContent.includes('=>') || searchBarContent.includes('function'));
    
    if (!hasFunctionalSyntax) {
      console.warn('WARNING: Components might not follow functional component patterns');
    }
  }

  console.log('PASS: React component files exist and have basic structure');
  process.exit(0);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}