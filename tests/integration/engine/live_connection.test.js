import { test, expect, describe } from 'bun:test';
import { generateText } from 'ai';

// This test is designed to be the final, definitive check of live AI connectivity.
// It is self-contained and bypasses the complex agent loop.

const LIVE_TEST_TIMEOUT = 60000; // 60 seconds, to allow for slow network or cold starts

describe('Live AI Provider Integration', () => {

  test('should connect to the configured reasoning_tier model and get a valid response', async () => {
    // --- 1. SETUP ---
    // We load the environment variables from the user's configured .env.development file.
    // This test assumes that the necessary API keys (e.g., OPENROUTER_API_KEY) are present there.
    // We do NOT need a separate .env.test file.

    // --- 2. DYNAMIC IMPORT ---
    // We MUST dynamically import the modules AFTER the environment is loaded.
    const { getAiProviders } = await import('../../../ai/providers.js');
    const config = await import('../../../stigmergy.config.js').then(m => m.default);

    // --- 3. EXECUTION ---
    // Get the AI provider functions using the loaded config
    const ai = getAiProviders(config);

    // Get the specific model for the reasoning tier, as configured in the user's .env files
    const model = ai.getModelForTier('reasoning_tier');

    // Make one single, direct call to the AI model.
    const { text, finishReason } = await generateText({
      model: model,
      prompt: 'Respond with only the word "OK".',
    });

    // --- 4. VERIFICATION ---
    // Assert that we got a successful response. We don't care about the content,
    // only that the connection worked and the response is valid.
    expect(text).toBeString();
    expect(text.length).toBeGreaterThan(0);
    expect(finishReason).toBe('stop');

    console.log(`\n[Live Test] Successfully received response from reasoning_tier model: "${text}"`);
  });

}, LIVE_TEST_TIMEOUT);