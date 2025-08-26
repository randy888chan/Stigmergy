import { getModelForTier, _resetProviderInstances } from '../../ai/providers.js';
import { createOpenAI } from '@ai-sdk/openai';
import config from '../../stigmergy.config.js';

// Mock the entire stigmergy.config.js module
jest.mock('../../stigmergy.config.js', () => ({
  __esModule: true, // This is important for ES modules
  default: {
    model_tiers: {
      deepseek_tier: {
        provider: 'deepseek',
        api_key_env: 'DEEPSEEK_TEST_KEY',
        base_url_env: 'DEEPSEEK_TEST_URL',
        model_name: 'deepseek/deepseek-chat',
      },
      openrouter_tier: {
        provider: 'openrouter',
        api_key_env: 'OPENROUTER_TEST_KEY',
        base_url_env: 'OPENROUTER_TEST_URL',
        model_name: 'google/gemini-pro-1.5',
      },
      mistral_tier: {
        provider: 'mistral',
        api_key_env: 'MISTRAL_TEST_KEY',
        base_url_env: 'MISTRAL_TEST_URL',
        model_name: 'mistralai/mistral-7b-instruct',
      },
    },
  },
}));

// Mock the createOpenAI function to inspect its calls
jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(),
}));

describe('Multi-provider configuration', () => {
  beforeEach(() => {
    // Reset the provider cache before each test
    _resetProviderInstances();

    // Reset mocks before each test
    createOpenAI.mockClear();

    // Mock environment variables
    process.env.DEEPSEEK_TEST_KEY = 'deepseek-key-123';
    process.env.DEEPSEEK_TEST_URL = 'https://api.deepseek.com/v1';
    process.env.OPENROUTER_TEST_KEY = 'openrouter-key-456';
    process.env.OPENROUTER_TEST_URL = 'https://openrouter.ai/api/v1';
    process.env.MISTRAL_TEST_KEY = 'mistral-key-789';
    process.env.MISTRAL_TEST_URL = 'https://api.mistral.ai/v1';

    // Mock the return value of createOpenAI
    const mockProvider = jest.fn().mockReturnValue('mock-model-instance');
    createOpenAI.mockReturnValue(mockProvider);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.DEEPSEEK_TEST_KEY;
    delete process.env.DEEPSEEK_TEST_URL;
    delete process.env.OPENROUTER_TEST_KEY;
    delete process.env.OPENROUTER_TEST_URL;
    delete process.env.MISTRAL_TEST_KEY;
    delete process.env.MISTRAL_TEST_URL;
  });

  it('should initialize Deepseek provider with correct key and URL', () => {
    getModelForTier('deepseek_tier');
    expect(createOpenAI).toHaveBeenCalledWith({
      apiKey: 'deepseek-key-123',
      baseURL: 'https://api.deepseek.com/v1',
    });
  });

  it('should initialize OpenRouter provider with correct key and URL', () => {
    getModelForTier('openrouter_tier');
    expect(createOpenAI).toHaveBeenCalledWith({
      apiKey: 'openrouter-key-456',
      baseURL: 'https://openrouter.ai/api/v1',
    });
  });

  it('should initialize Mistral provider with correct key and URL', () => {
    getModelForTier('mistral_tier');
    expect(createOpenAI).toHaveBeenCalledWith({
      apiKey: 'mistral-key-789',
      baseURL: 'https://api.mistral.ai/v1',
    });
  });

  it('should use the same provider instance for the same tier', () => {
    getModelForTier('deepseek_tier');
    getModelForTier('deepseek_tier');
    expect(createOpenAI).toHaveBeenCalledTimes(1);
  });

  it('should create a new provider instance for a different tier', () => {
    getModelForTier('deepseek_tier');
    getModelForTier('openrouter_tier');
    expect(createOpenAI).toHaveBeenCalledTimes(2);
  });
});
