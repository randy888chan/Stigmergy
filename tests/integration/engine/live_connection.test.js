import { test, expect, describe } from 'bun:test';

// Import from our own application stack, not directly from 'ai'
import { generateText } from '../../../engine/llm_adapter.js';
import { getAiProviders } from '../../../ai/providers.js';
import config from '../../../stigmergy.config.js';

const LIVE_TEST_TIMEOUT = 60000;

describe('Live AI Provider Integration', () => {

  test('should connect to the configured reasoning_tier model and get a valid response', async () => {
    // --- SETUP ---
    // Get the AI provider instance, which is how the app uses it
    const ai = getAiProviders(config);

    // --- EXECUTION ---
    // Call our own generateText function, which wraps the AI SDK call.
    // This is a true integration test of our application's logic.
    const text = await generateText(
      'Respond with only the word "OK".',
      ai,
      'reasoning_tier',
      config
    );

    // --- VERIFICATION ---
    expect(text).toBeString();
    expect(text.length).toBeGreaterThan(0);

    console.log(`\n[Live Test] Successfully received response from reasoning_tier: "${text}"`);
  });

}, LIVE_TEST_TIMEOUT);