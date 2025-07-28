const { createOpenAI } = require('@ai-sdk/openai');
const { createFireworks } = require('@ai-sdk/fireworks');
const { createAnthropic } = require('@ai-sdk/anthropic');

// This function provides a single, unified way to get an AI model.
// It prioritizes providers based on which API keys are available in the .env file.
function getModel() {
  const config = require('dotenv').config().parsed || process.env;

  // Priority 1: Custom OpenAI-compatible endpoint (like OpenRouter, DeepSeek, local models)
  if (config.OPENAI_ENDPOINT && config.CUSTOM_MODEL) {
    console.log(`[AI Provider] Using Custom Endpoint: ${config.OPENAI_ENDPOINT} with model ${config.CUSTOM_MODEL}`);
    const provider = createOpenAI({
      apiKey: config.OPENAI_KEY || 'sk-or-v1-abc', // OpenRouter key, or placeholder for local models
      baseURL: config.OPENAI_ENDPOINT,
    });
    return provider(config.CUSTOM_MODEL);
  }

  // Priority 2: OpenRouter (Primary recommended provider for flexibility)
  if (config.OPENROUTER_API_KEY) {
    console.log('[AI Provider] Using OpenRouter');
    const openrouter = createOpenAI({
      apiKey: config.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    // Default to a powerful and cost-effective model on OpenRouter
    return openrouter(config.LITELLM_MODEL_ID || 'google/gemini-pro-1.5');
  }

  // Priority 3: Direct Provider APIs
  if (config.FIREWORKS_KEY) {
    console.log('[AI Provider] Using Fireworks.ai');
    const fireworks = createFireworks({ apiKey: config.FIREWORKS_KEY });
    return fireworks('accounts/fireworks/models/firefunction-v2');
  }

  if (config.ANTHROPIC_API_KEY) {
      console.log('[AI Provider] Using Anthropic');
      const anthropic = createAnthropic({ apiKey: config.ANTHROPIC_API_KEY });
      return anthropic('claude-3-5-sonnet-20240620');
  }

  if (config.OPENAI_KEY) {
    console.log('[AI Provider] Using OpenAI');
    const openai = createOpenAI({ apiKey: config.OPENAI_KEY });
    return openai('gpt-4o');
  }

  throw new Error(
    'No AI provider API key found. Please set OPENROUTER_API_KEY, FIREWORKS_KEY, ANTHROPIC_API_KEY, or OPENAI_KEY in your .env file.'
  );
}

// System prompt remains the same
function systemPrompt() {
  const now = new Date().toISOString();
  return `You are an expert researcher. Today is ${now}. Follow these instructions when responding...`; // (content is the same as before)
}

module.exports = {
  getModel,
  systemPrompt,
};
