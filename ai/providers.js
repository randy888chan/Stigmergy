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
        throw new Error(
            `Model tier '${tier}' is not defined in stigmergy.config.js. ` +
            `Available tiers: ${Object.keys(config.model_tiers).join(', ')}`
        );
    }

    const { provider, api_key_env, base_url_env, model_name } = tierConfig;

    if (!api_key_env || !model_name) {
        throw new Error(
            `Tier '${tier}' configuration is incomplete. ` +
            `Missing: ${!api_key_env ? 'api_key_env' : ''} ${!model_name ? 'model_name' : ''}. ` +
            `Please check your stigmergy.config.js file.`
        );
    }

    const apiKey = process.env[api_key_env];
    const baseURL = process.env[base_url_env];

    if (!apiKey) {
        const suggestion = getSuggestionForProvider(provider);
        throw new Error(
            `API key environment variable '${api_key_env}' for tier '${tier}' is not set. ` +
            `${suggestion}`
        );
    }

    // Use a unique key for the cache based on the API key and base URL
    const cacheKey = `${tier}-${apiKey.slice(-4)}-${baseURL || 'default'}`;

    if (!providerInstances[cacheKey]) {
        console.log(`[AI Provider] Initializing ${provider} provider for tier '${tier}'`);
        if (baseURL) {
            console.log(`[AI Provider] Using endpoint: ${baseURL}`);
        }

        const providerOptions = { apiKey };
        if (baseURL) {
            providerOptions.baseURL = baseURL;
        }

        try {
            providerInstances[cacheKey] = createOpenAI(providerOptions);
        } catch (error) {
            throw new Error(
                `Failed to initialize ${provider} provider for tier '${tier}': ${error.message}`
            );
        }
    }

    const providerInstance = providerInstances[cacheKey];
    console.log(`[AI Provider] Using Model: ${model_name} (Tier: ${tier}, Provider: ${provider})`);
    
    return providerInstance(model_name);
}

function getSuggestionForProvider(provider) {
    const suggestions = {
        'openrouter': 'Get your API key at https://openrouter.ai/keys',
        'deepseek': 'Get your API key at https://platform.deepseek.com/api_keys', 
        'kimi': 'Get your API key at https://platform.moonshot.cn/console/api-keys',
        'google': 'Get your API key at https://aistudio.google.com/app/apikey'
    };
    
    return suggestions[provider] || 'Please check your provider documentation for API key setup.';
}
