import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
// REMOVED: import config from '../stigmergy.config.js';

export function getAiProviders(config) { // ACCEPTS config
  // This function now acts as a factory for the other functions,
  // passing the necessary config to them.
  return {
    getModelForTier: (tier, useCase) => getModelForTier(tier, useCase, config),
    _resetProviderInstances,
    getExecutionOptions,
    selectExecutionMethod,
    validateProviderConfig,
    getProviderSummary,
  };
}

let providerInstances = {};

export function _resetProviderInstances() {
    providerInstances = {};
}

export function getModelForTier(tier = 'utility_tier', useCase = null, config) {
    if (!config || !config.model_tiers) {
        throw new Error("A valid configuration object with model_tiers must be provided.");
    }
    const tierConfig = config.model_tiers[tier];
    if (!tierConfig) {
        throw new Error(`Model tier '${tier}' is not defined in the provided config.`);
    }

    const { provider, model_name, api_key_env, base_url_env } = tierConfig;
    console.log(`[DEBUG] Tier: ${tier}`);
    console.log(`[DEBUG] Provider: ${provider}`);
    console.log(`[DEBUG] Model Name: ${model_name}`);
    console.log(`[DEBUG] API Key Env: ${api_key_env}`);
    console.log(`[DEBUG] Base URL Env: ${base_url_env}`);
    
    const apiKey = process.env[api_key_env];
    // THIS IS THE CRITICAL LOGIC CHANGE:
    // It now correctly uses the tier-specific base URL if it exists.
    const baseURL = base_url_env ? process.env[base_url_env] : null;
    console.log(`[DEBUG] Base URL: ${baseURL}`);

    if (!apiKey) {
        throw new Error(`API key environment variable '${api_key_env}' for tier '${tier}' is not set.`);
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
            // List of providers known to use OpenAI-compatible APIs that benefit from strict compatibility.
            const openAICompatibleProviders = [
                'openrouter',
                'deepseek',
                'kimi',
                'mistral',
                'anthropic', // Assuming Anthropic is accessed via an OpenAI-compatible endpoint as per config
                'openai'
            ];

            // Apply strict compatibility for known providers or if the URL suggests it (e.g., OpenRouter).
            if (openAICompatibleProviders.includes(provider) || (baseURL && baseURL.includes('openrouter'))) {
                providerOptions.compatibility = 'strict';
            }

            // Use the OpenAI SDK for all non-Google providers, which supports various compatible APIs.
            providerInstances[cacheKey] = createOpenAI(providerOptions);
        }
    }
    return providerInstances[cacheKey](model_name);
}

// These other functions are kept for architectural completeness.
// If they need config in the future, it should be passed to them.
export function getExecutionOptions() { /* ... */ }
export function selectExecutionMethod(taskComplexity = 'medium', userPreference = null) { /* ... */ }
export function validateProviderConfig() { /* ... */ }
export function getProviderSummary() { /* ... */ }