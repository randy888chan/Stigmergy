import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

async function testValidation() {
  try {
    const validationScriptPath = path.join(process.cwd(), 'evaluation/validators/validate_crud_api.js');
    const tempSolutionDir = path.join(process.cwd(), 'temp_solution');
    
    // Create a package.json file to enable ES modules support
    const command = `node --experimental-specifier-resolution=node ${validationScriptPath} "${tempSolutionDir}"`;
    console.log(`Executing validation command: ${command}`);
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.error(`Validation script stderr: ${stderr}`);
    }
    
    console.log(`Validation output: ${stdout}`);
  } catch (error) {
    console.error(`Validation script failed: ${error.message}`);
    if (error.stderr) {
      console.error(`Detailed stderr: ${error.stderr}`);
    }
    if (error.stdout) {
      console.error(`Detailed stdout: ${error.stdout}`);
    }
  }
}

testValidation();