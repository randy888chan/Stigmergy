// tests/global_state.js

// This module provides a single, shared instance of the GraphStateManager
// for the entire test suite. This prevents multiple connection pools from
// being created and ensures we can gracefully shut down the connection
// in the global teardown script.

import { GraphStateManager } from '../src/infrastructure/state/GraphStateManager.js';

let stateManagerInstance = null;

export function getTestStateManager() {
  if (!stateManagerInstance) {
    // We can use a dummy project root because the connection details
    // are coming from environment variables.
    stateManagerInstance = new GraphStateManager('/test-project-global');
  }
  return stateManagerInstance;
}

export async function closeTestStateManager() {
  if (stateManagerInstance) {
    await stateManagerInstance.closeDriver();
    stateManagerInstance = null;
  }
}
