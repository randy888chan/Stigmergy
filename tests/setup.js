// Global setup script that runs once before all tests
import { cp, rm } from 'fs/promises';
import { join } from 'path';

// Create a temporary copy of the .stigmergy-core directory for tests
export default async function setup() {
  const fixturesDir = join(process.cwd(), 'fixtures');
  const tempCoreDir = join(process.cwd(), '.stigmergy-core-test');
  const sourceCoreDir = join(process.cwd(), '.stigmergy-core');
  
  try {
    // Check if fixtures directory exists, otherwise copy from .stigmergy-core
    if (await checkDirectoryExists(fixturesDir)) {
      await cp(fixturesDir, tempCoreDir, { recursive: true });
    } else if (await checkDirectoryExists(sourceCoreDir)) {
      await cp(sourceCoreDir, tempCoreDir, { recursive: true });
    } else {
      console.log('No source directory found to copy for testing');
    }
    console.log('Global setup completed: Created temporary .stigmergy-core-test directory');
  } catch (error) {
    console.error('Error during global setup:', error);
    throw error;
  }
}

async function checkDirectoryExists(path) {
  try {
    const stat = await import('fs').then(fs => fs.promises.stat(path));
    return stat.isDirectory();
  } catch {
    return false;
  }
}