import { mock } from 'bun:test';

console.log("Loading UPDATED tests/mocks/ai-providers.js mock");

// This mock now mimics the new structure of getModelForTier.

// 1. A mock "language model" object. In tests where generateObject is mocked,
//    this object is just a placeholder that gets passed along.
const mockLanguageModel = { type: 'mock-language-model' };

// 2. A mock "client" function. This function would typically be an instance
//    of createOpenAI, etc. In our mock, it's a function that returns the
//    placeholder model.
const mockClient = mock(() => mockLanguageModel);

// 3. The primary mock for getModelForTier. It returns the structure that
//    the rest of the application now expects.
export const getModelForTier = mock(() => ({
  client: mockClient,
  modelName: 'mock-model-name'
}));

// We also export the other functions from the real module to prevent import errors,
// but we can just give them simple mock implementations.
export const _resetProviderInstances = mock();

// This mock for getAiProviders returns an object containing our mocked getModelForTier.
export const getAiProviders = mock(() => ({
  getModelForTier: getModelForTier,
  // We can also mock other functions that might be on the ai provider if needed
  generateObject: mock((args) => {
    // A default mock implementation for generateObject if it's not mocked in the test itself
    console.warn("[Mock AI Provider] generateObject was called but not mocked in the test. Returning empty object.");
    return Promise.resolve({ object: {} });
  })
}));