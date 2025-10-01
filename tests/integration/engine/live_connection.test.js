import { test, expect, describe } from 'bun:test';
import { generateText } from 'ai';

const LIVE_TEST_TIMEOUT = 60000;

describe('Live AI Provider Integration', () => {

  test('should connect to the configured reasoning_tier model and get a valid response', async () => {
    // --- DYNAMIC IMPORT ---
    const { getModelForTier } = await import('../../../ai/providers.js');
    const config = await import('../../../stigmergy.config.js').then(m => m.default);

    // --- EXECUTION ---
    // Get the provider client and model name from our updated function
    const { client, modelName } = getModelForTier('reasoning_tier', null, config);

    // Make one single, direct call, passing the client instance to the 'model' property.
    // This tells the SDK to bypass the Vercel Gateway.
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