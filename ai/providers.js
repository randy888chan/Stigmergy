const { createOpenAI } = require('@ai-sdk/openai');
const { createFireworks } = require('@ai-sdk/fireworks');

// Helper to get the appropriate AI model based on available environment keys.
// This makes the system flexible and prioritizes more powerful models if available.
function getModel() {
  // Priority: Custom Endpoint > Fireworks > OpenAI
  if (process.env.OPENAI_ENDPOINT && process.env.CUSTOM_MODEL) {
    console.log(`[AI Provider] Using Custom OpenAI-compatible Endpoint with model ${process.env.CUSTOM_MODEL}`);
    const customProvider = createOpenAI({
      apiKey: process.env.OPENAI_KEY || 'ollama', // Often 'ollama' or not needed for local
      baseURL: process.env.OPENAI_ENDPOINT,
    });
    return customProvider(process.env.CUSTOM_MODEL);
  }

  if (process.env.FIREWORKS_KEY) {
    console.log('[AI Provider] Using Fireworks.ai');
    const fireworks = createFireworks({ apiKey: process.env.FIREWORKS_KEY });
    return fireworks('accounts/fireworks/models/firefunction-v2');
  }

  if (process.env.OPENAI_KEY) {
    console.log('[AI Provider] Using OpenAI');
    const openai = createOpenAI({ apiKey: process.env.OPENAI_KEY });
    return openai('gpt-4o');
  }

  throw new Error(
    'No AI provider API key found. Please set FIREWORKS_KEY or OPENAI_KEY in your .env file.'
  );
}

module.exports = {
  getModel,
};
