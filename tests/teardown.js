// Global teardown script that runs once after all tests
import { rm } from 'fs/promises';
import { join } from 'path';

// Delete the temporary directory created by setup.js
export default async function teardown() {
  const tempCoreDir = join(process.cwd(), '.stigmergy-core-test');
  
  try {
    await rm(tempCoreDir, { recursive: true, force: true });
    console.log('Global teardown completed: Removed temporary .stigmergy-core-test directory');
  } catch (error) {
    console.error('Error during global teardown:', error);
    // Don't throw here as it shouldn't fail the test suite
  }
}