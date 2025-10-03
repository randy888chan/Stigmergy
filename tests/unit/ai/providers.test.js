import { test, expect, describe, mock, beforeEach, afterAll } from 'bun:test';

// 1. Get the real reset function from the original module *before* any mocking.
import { _resetProviderInstances } from '../../../ai/providers.js';

// 2. This is the mock function we will control and inspect.
const mockCreateOpenAI = mock(() => mock(() => 'mock-model-instance'));

// 3. We tell bun.test to replace the dependency with our mock.
mock.module('@ai-sdk/openai', () => ({
  createOpenAI: mockCreateOpenAI,
}));

// 4. Declare the function we will be testing. It will be assigned in beforeEach.
let getModelForTier;

describe('AI Provider Logic', () => {
  beforeEach(async () => {
    // Dynamically import the module here to get a fresh version for each test.
    // This is a robust pattern to avoid test pollution.
    const providersModule = await import('../../../ai/providers.js');
    getModelForTier = providersModule.getModelForTier;

    // Clear any previous mock calls and reset the provider cache using the real function.
    mockCreateOpenAI.mockClear();
    _resetProviderInstances();

    // Reset environment variables
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_BASE_URL;
  });

  test('should use createOpenAI for the OpenAI provider without strict compatibility', () => {
    // 1. Arrange
    const config = {
      model_tiers: {
        some_tier: {
          provider: 'openai',
          model_name: 'gpt-4',
          api_key_env: 'OPENAI_API_KEY',
        },
      },
    };
    process.env.OPENAI_API_KEY = 'test-key';

    // 2. Act
    getModelForTier('some_tier', null, config);

    // 3. Assert
    expect(mockCreateOpenAI).toHaveBeenCalledTimes(1);
    const options = mockCreateOpenAI.mock.calls[0][0];
    expect(options).toEqual({
      apiKey: 'test-key',
    });
  });

  test('should use createOpenAI with "strict" compatibility for OpenRouter provider', () => {
    // 1. Arrange
    const config = {
      model_tiers: {
        some_tier: {
          provider: 'openrouter',
          model_name: 'openrouter/some-model',
          api_key_env: 'OPENROUTER_API_KEY',
          base_url_env: 'OPENROUTER_BASE_URL',
        },
      },
    };
    process.env.OPENROUTER_API_KEY = 'test-key-or';
    process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api';


    // 2. Act
    getModelForTier('some_tier', null, config);

    // 3. Assert
    expect(mockCreateOpenAI).toHaveBeenCalledTimes(1);
    const options = mockCreateOpenAI.mock.calls[0][0];
    expect(options).toEqual({
      apiKey: 'test-key-or',
      baseURL: 'https://openrouter.ai/api',
      compatibility: 'strict', // This is the key assertion
    });
  });

  test('should remove trailing /v1 from baseURL before calling provider', () => {
    // 1. Arrange
    const config = {
      model_tiers: {
        some_tier: {
          provider: 'openrouter',
          model_name: 'openrouter/some-model',
          api_key_env: 'OPENROUTER_API_KEY',
          base_url_env: 'OPENROUTER_BASE_URL',
        },
      },
    };
    process.env.OPENROUTER_API_KEY = 'test-key-or';
    // The key part of this test: the URL has a trailing /v1
    process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

    // 2. Act
    getModelForTier('some_tier', null, config);

    // 3. Assert
    expect(mockCreateOpenAI).toHaveBeenCalledTimes(1);
    const options = mockCreateOpenAI.mock.calls[0][0];
    // We expect the /v1 to have been removed.
    expect(options.baseURL).toBe('https://openrouter.ai/api');
  });
});

afterAll(() => {
  // Restore the original module after all tests in this file are done to prevent pollution
  mock.restore();
});