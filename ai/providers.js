import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

let providerInstances = {};

export function _resetProviderInstances() {
    providerInstances = {};
}

// THIS FUNCTION IS THE CORE OF THE FIX. It now returns the client and the model name separately.
export function getModelForTier(tier = 'utility_tier', useCase = null, config) {
    if (!config || !config.model_tiers) {
        throw new Error("A valid configuration object with model_tiers must be provided.");
    }
    const tierConfig = config.model_tiers[tier];
    if (!tierConfig) {
        throw new Error(`Model tier '${tier}' is not defined in the provided config.`);
    }

    const { provider, model_name, api_key_env, base_url_env } = tierConfig;
    const apiKey = process.env[api_key_env];
    let baseURL = base_url_env ? process.env[base_url_env] : null;

    if (!apiKey) {
        throw new Error(`API key environment variable '${api_key_env}' for tier '${tier}' is not set.`);
    }

    // Defensive coding: The Vercel AI SDK automatically adds `/v1`, so we MUST remove it from the base URL if it exists.
    if (baseURL && baseURL.endsWith('/v1')) {
      baseURL = baseURL.slice(0, -3);
      console.log(`[INFO] Removed trailing '/v1' from base URL. New URL: ${baseURL}`);
    }

    const cacheKey = `${tier}-${apiKey.slice(-4)}-${baseURL || 'default'}`;

    if (!providerInstances[cacheKey]) {
        const providerOptions = { apiKey };
        if (baseURL) {
            providerOptions.baseURL = baseURL;
        }

        if (provider === 'google') {
            providerInstances[cacheKey] = createGoogleGenerativeAI(providerOptions);
        } else {
            // All other providers (OpenAI, OpenRouter, Mistral, etc.) use the OpenAI-compatible client.
            const openAICompatibleProviders = ['openrouter', 'deepseek', 'mistral', 'anthropic', 'openai', 'codestral_utility'];
            if (openAICompatibleProviders.includes(provider) || (baseURL && baseURL.includes('openrouter'))) {
                providerOptions.compatibility = 'strict';
            }
            providerInstances[cacheKey] = createOpenAI(providerOptions);
        }
    }
    // Return both the client instance AND the model name
    return { client: providerInstances[cacheKey], modelName: model_name };
}

// The getAiProviders function is no longer the best pattern. We can simplify by removing it
// or keeping it for legacy reasons, but the core logic is now in getModelForTier.
export function getAiProviders(config) {
  return {
    getModelForTier: (tier, useCase) => getModelForTier(tier, useCase, config),
    // ... other functions
  };
}