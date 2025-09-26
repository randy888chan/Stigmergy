console.log("Loading tests/mocks/ai-providers.js mock");
import { mock } from 'bun:test';

// This is our high-fidelity mock. It provides a fake getModelForTier function
// that returns a "mock model" with the necessary functions, just like the real one.
export const getModelForTier = mock(() => ({
  generate: mock().mockResolvedValue({ text: '{}' }),
  stream: mock().mockResolvedValue({ stream: {} }),
}));

// We also export the other functions from the real module to prevent import errors,
// but we can just give them simple mock implementations.
export const _resetProviderInstances = mock();
export const getExecutionOptions = mock(() => ({}));
export const selectExecutionMethod = mock(() => 'internal_dev');
export const validateProviderConfig = mock(() => ({ isValid: true, errors: [], warnings: [] }));
export const getProviderSummary = mock(() => ({}));
export const getAiProviders = mock(() => ({
    getModelForTier: getModelForTier
}));