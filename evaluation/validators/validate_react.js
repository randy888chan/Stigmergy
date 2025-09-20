import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function validate(directory) {
  // Use the provided directory parameter, fallback to a default if not provided
  const solutionDir = directory ? path.resolve(directory) : path.join(process.cwd(), 'temp_solution');

  try {
    // 1. Check if required files exist
    const requiredFiles = ['components/ItemList.js', 'components/SearchBar.js'];
    for (const file of requiredFiles) {
      const filePath = path.join(solutionDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`${file} not found in the solution directory.`);
      }
    }

    // 2. Install dependencies
    try {
      const packageJsonPath = path.join(solutionDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        await execPromise('npm init -y', { cwd: solutionDir });
      }
      await execPromise('npm install react react-dom esbuild', { cwd: solutionDir });
    } catch (error) {
      throw new Error('npm install failed.');
    }

    // 3. Create a test entry point file
    const entryPointContent = `
import React from 'react';
import ReactDOM from 'react-dom';
import ItemList from './components/ItemList';
import SearchBar from './components/SearchBar';

function App() {
  return (
    <div>
      <h1>Test App</h1>
      <SearchBar />
      <ItemList items={['item1', 'item2']} />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
    `;
    const entryPointPath = path.join(solutionDir, 'index.js');
    fs.writeFileSync(entryPointPath, entryPointContent);

    // Create a dummy index.html
    const htmlPath = path.join(solutionDir, 'index.html');
    fs.writeFileSync(htmlPath, '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>');

    // 4. Attempt to build the project with esbuild
    try {
      const esbuildPath = path.join(solutionDir, 'node_modules/.bin/esbuild');
      await execPromise(`${esbuildPath} ${entryPointPath} --bundle --outfile=dist/bundle.js --loader:.js=jsx`, { cwd: solutionDir });
    } catch (error) {
      throw new Error('esbuild failed. The React components likely have syntax errors.');
    }

    return {
      success: true,
      message: 'React validation successful (files exist, dependencies install, and build succeeds).'
    };

  } catch (error) {
    return {
      success: false,
      message: `React validation failed: ${error.message}`
    };
  }
}

// If called directly, run validation
if (import.meta.url === `file://${process.argv[1]}`) {
  const directory = process.argv[2] || './temp_solution';
  validate(directory).then(result => {
    // Only output the JSON result, nothing else
    console.log(JSON.stringify(result));
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    // Output error as JSON
    console.log(JSON.stringify({ success: false, message: error.message }));
    process.exit(1);
  });
}

export default validate;