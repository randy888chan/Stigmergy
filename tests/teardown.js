// Global teardown script that runs once after all tests
import { rm } from 'fs/promises';
import { join } from 'path';
import { closeTestStateManager } from './global_state.js';

// Delete the temporary directory created by setup.js
export default async function teardown() {
  const tempCoreDir = join(process.cwd(), '.stigmergy-core-test');
  
  try {
    await rm(tempCoreDir, { recursive: true, force: true });
    console.log('Global teardown: Removed temporary .stigmergy-core-test directory');

    // --- DEFINITIVE FIX FOR HANGING TESTS ---
    // Close the shared database connection pool.
    await closeTestStateManager();
    console.log('Global teardown: Closed shared GraphStateManager connection.');
    // --- END FIX ---

  } catch (error) {
    console.error('Error during global teardown:', error);
    // Don't throw here as it shouldn't fail the test suite
  }
}
