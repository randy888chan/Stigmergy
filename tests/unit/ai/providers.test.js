import { test, expect, describe, mock } from 'bun:test';

// Mock the external dependencies
mock.module('@ai-sdk/openai', () => ({
  createOpenAI: mock(() => mock(() => 'mock-model')),
}));

// Dynamically import the module to be tested
const { getAiProviders } = await import('../../../ai/providers.js');
const { createOpenAI } = await import('@ai-sdk/openai');

describe('AI Provider Configuration', () => {
  test('should create OpenAI provider with strict compatibility', () => {
    // 1. Arrange
    const mockConfig = {
      model_tiers: {
        openai_reasoning: {
          provider: 'openai',
          model_name: 'o1-preview',
          api_key_env: 'OPENAI_API_KEY',
          base_url_env: null,
        },
      },
    };

    process.env.OPENAI_API_KEY = 'test-key';
    const ai = getAiProviders(mockConfig);

    // 2. Act
    ai.getModelForTier('openai_reasoning');

    // 3. Assert
    expect(createOpenAI).toHaveBeenCalled();
    const lastCall = createOpenAI.mock.calls[createOpenAI.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(
      expect.objectContaining({
        compatibility: 'strict',
      })
    );

    // Cleanup
    delete process.env.OPENAI_API_KEY;
  });
});