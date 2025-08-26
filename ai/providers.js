import { createOpenAI } from "@ai-sdk/openai";
import "dotenv/config.js";
import config from '../stigmergy.config.js';

// A cache for provider instances to avoid re-creating them on every call
let providerInstances = {};

// Exported for testing purposes to reset the cache between tests
export function _resetProviderInstances() {
    providerInstances = {};
}

export function getModelForTier(tier = 'b_tier') {
    const tierConfig = config.model_tiers[tier];
    if (!tierConfig) {
        throw new Error(`Model tier '${tier}' is not defined in stigmergy.config.js.`);
    }

    const { api_key_env, base_url_env, model_name } = tierConfig;

    if (!api_key_env || !model_name) {
        throw new Error(`Tier '${tier}' is missing 'api_key_env' or 'model_name' in config.`);
    }

    const apiKey = process.env[api_key_env];
    const baseURL = process.env[base_url_env]; // Fetch the specific base URL for the provider

    if (!apiKey) {
        throw new Error(`API key environment variable '${api_key_env}' for tier '${tier}' is not set in your .env file.`);
    }

    // Use a unique key for the cache based on the API key and base URL
    const cacheKey = `${apiKey.slice(-4)}-${baseURL}`;

    if (!providerInstances[cacheKey]) {
        console.log(`[AI Provider] Initializing provider for tier '${tier}' at URL: ${baseURL}`);

        const providerOptions = { apiKey };
        if (baseURL) {
            providerOptions.baseURL = baseURL;
        }

        // This assumes all providers use an OpenAI-compatible API structure, which is common.
        // For providers with unique SDKs (like Google), you would add conditional logic here.
        providerInstances[cacheKey] = createOpenAI(providerOptions);
    }

    const providerInstance = providerInstances[cacheKey];

    console.log(`[AI Provider] Using Model: ${model_name} (Tier: ${tier})`);
    return providerInstance(model_name);
}
