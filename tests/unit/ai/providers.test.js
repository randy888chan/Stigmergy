import { test, expect, describe, mock, beforeEach, afterAll } from 'bun:test';

// 1. Mock the dependency BEFORE it's used by the module we're testing.
const mockCreateOpenAI = mock(() => mock(() => 'mock-model-instance'));
mock.module('@ai-sdk/openai', () => ({
  createOpenAI: mockCreateOpenAI,
}));

// 2. Now, import the module under test. Bun will ensure it gets the mocked dependency.
import { getModelForTier, _resetProviderInstances } from '../../../ai/providers.js';


describe('AI Provider Logic', () => {
  beforeEach(() => {
    // 3. Reset state before each test run.
    mockCreateOpenAI.mockClear();
    _resetProviderInstances(); // This is the real function from the module.

    // Reset environment variables to ensure test isolation.
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_BASE_URL;
  });

  afterAll(() => {
    // Restore the original module after all tests in this file are done to prevent pollution.
    mock.restore();
  });

  test('should use createOpenAI for the OpenAI provider without strict compatibility', () => {
    // Arrange
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

    // Act
    getModelForTier('some_tier', null, config);

    // Assert
    expect(mockCreateOpenAI).toHaveBeenCalledTimes(1);
    const options = mockCreateOpenAI.mock.calls[0][0];
    expect(options).toEqual({
      apiKey: 'test-key',
    });
  });

  test('should use createOpenAI with "strict" compatibility for OpenRouter provider', () => {
    // Arrange
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


    // Act
    getModelForTier('some_tier', null, config);

    // Assert
    expect(mockCreateOpenAI).toHaveBeenCalledTimes(1);
    const options = mockCreateOpenAI.mock.calls[0][0];
    expect(options).toEqual({
      apiKey: 'test-key-or',
      baseURL: 'https://openrouter.ai/api',
      compatibility: 'strict', // This is the key assertion
    });
  });

  test('should remove trailing /v1 from baseURL before calling provider', () => {
    // Arrange
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

    // Act
    getModelForTier('some_tier', null, config);

    // Assert
    expect(mockCreateOpenAI).toHaveBeenCalledTimes(1);
    const options = mockCreateOpenAI.mock.calls[0][0];
    // We expect the /v1 to have been removed.
    expect(options.baseURL).toBe('https://openrouter.ai/api');
  });
});