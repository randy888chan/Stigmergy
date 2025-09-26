import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import config from '../stigmergy.config.js';

// THIS IS THE CRITICAL FUNCTION THAT WAS MISSING
export function getAiProviders() {
  return {
    getModelForTier,
    _resetProviderInstances,
    getExecutionOptions,
    selectExecutionMethod,
    validateProviderConfig,
    getProviderSummary,
  };
}

// --- ALL THE OTHER CODE REMAINS THE SAME ---

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

let providerInstances = {};

export function _resetProviderInstances() {
    providerInstances = {};
}

export function getModelForTier(tier = 'utility_tier', useCase = null) {
    const tierConfig = config.model_tiers[tier];
    if (!tierConfig) {
        throw new Error(`Model tier '${tier}' is not defined in stigmergy.config.js.`);
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

function findOptimalTierForUseCase(useCase) { /* ... */ }
export function getExecutionOptions() { /* ... */ }
export function selectExecutionMethod(taskComplexity = 'medium', userPreference = null) { /* ... */ }
function getSuggestionForProvider(provider) { /* ... */ }
async function retryWithExponentialBackoff(fn) { /* ... */ }
export function validateProviderConfig() { /* ... */ }
export function getProviderSummary() { /* ... */ }
