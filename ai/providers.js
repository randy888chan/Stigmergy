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

// THE CRITICAL CHANGE: This function now ACCEPTS the config.
export function getModelForTier(tier = 'utility_tier', useCase = null, config) {
    if (!config || !config.model_tiers) {
        throw new Error("A valid configuration object with model_tiers must be provided.");
    }
    const tierConfig = config.model_tiers[tier];
    if (!tierConfig) {
        throw new Error(`Model tier '${tier}' is not defined in the provided config.`);
    }
    const { provider, model_name } = tierConfig;
    const api_key_env = typeof tierConfig.api_key_env === 'function' ? tierConfig.api_key_env() : tierConfig.api_key_env;
    const base_url_env = typeof tierConfig.base_url_env === 'function' ? tierConfig.base_url_env() : tierConfig.base_url_env;
    const apiKey = process.env[api_key_env];
    const baseURL = base_url_env ? process.env[base_url_env] : null;

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
            if (provider === 'openrouter' || baseURL?.includes('openrouter')) {
                providerOptions.compatibility = 'strict';
            }
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