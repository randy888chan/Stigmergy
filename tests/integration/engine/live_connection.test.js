import { test, expect, describe } from 'bun:test';
// THIS IS THE CORRECT HIGH-LEVEL FUNCTION TO USE
import { generateText } from 'ai';

const LIVE_TEST_TIMEOUT = 60000;

describe('Live AI Provider Integration', () => {

  test('should connect to the configured reasoning_tier model and get a valid response', async () => {
    // --- DYNAMIC IMPORT ---
    // We dynamically import these to ensure the preloaded environment is ready.
    const { getModelForTier } = await import('../../../ai/providers.js');
    const config = await import('../../../stigmergy.config.js').then(m => m.default);

    // --- EXECUTION ---
    // Get the provider client and model name from our robust function.
    const { client, modelName } = getModelForTier('reasoning_tier', null, config);

    // THIS IS THE CRITICAL AND DEFINITIVE FIX:
    // We use the high-level `generateText` function, but we pass it a model
    // instance created by our specific provider client `client(modelName)`.
    // This is the official, documented way to bypass the Vercel Gateway and
    // connect directly to a third-party provider like OpenRouter.
    const { text, finishReason } = await generateText({
      model: client(modelName),
      prompt: 'Respond with only the word "OK".',
    });

    // --- VERIFICATION ---
    expect(text).toBeString();
    expect(text.length).toBeGreaterThan(0);
    expect(finishReason).toBe('stop');

    console.log(`\n[Live Test] Successfully received response from ${modelName}: "${text}"`);
  });

}, LIVE_TEST_TIMEOUT);