// Teardown script that runs after all tests
import fs from 'fs-extra';
import path from 'path';

async function globalTeardown() {
  console.log('\\n--- Global Test Teardown ---');
  const tempDir = path.join(process.cwd(), '.stigmergy-core-test');
  try {
    if (fs.existsSync(tempDir)) {
      await fs.remove(tempDir);
      console.log(`🧹 Successfully cleaned up temporary directory: ${tempDir}`);
    }
  } catch (error) {
    console.error(`Error during teardown cleaning up ${tempDir}:`, error);
  }
  console.log('--- Teardown Complete ---');
}

globalTeardown();
