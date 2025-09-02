import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import "dotenv/config.js";
import config from '../stigmergy.config.js';

// A cache for provider instances to avoid re-creating them on every call
let providerInstances = {};

// Exported for testing purposes to reset the cache between tests
export function _resetProviderInstances() {
    providerInstances = {};
}

// Enhanced model selection with reasoning vs non-reasoning intelligence
export function getModelForTier(tier = 'b_tier', useCase = null) {
    const tierConfig = config.model_tiers[tier];
    if (!tierConfig) {
        throw new Error(
            `Model tier '${tier}' is not defined in stigmergy.config.js. ` +
            `Available tiers: ${Object.keys(config.model_tiers).join(', ')}`
        );
    }

    // If use case is provided, try to find a better matching tier
    if (useCase) {
        const betterTier = findOptimalTierForUseCase(useCase);
        if (betterTier && betterTier !== tier) {
            console.log(`[AI Provider] Optimizing tier: ${tier} → ${betterTier} for use case: ${useCase}`);
            return getModelForTier(betterTier, null); // Avoid recursion
        }
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
            if (provider === 'google') {
                providerInstances[cacheKey] = createGoogleGenerativeAI(providerOptions);
            } else {
                // Default to OpenAI-compatible (OpenRouter, etc.)
                providerInstances[cacheKey] = createOpenAI(providerOptions);
            }
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

// Find optimal tier based on use case
function findOptimalTierForUseCase(useCase) {
    const useCaseMapping = {
        // Reasoning tasks
        'complex_planning': 'reasoning_tier',
        'architectural_decisions': 'reasoning_tier', 
        'problem_solving': 'reasoning_tier',
        'business_planning': 'strategic_tier',
        'technical_architecture': 'strategic_tier',
        'research': 'strategic_tier',
        
        // Execution tasks
        'code_implementation': 'execution_tier',
        'documentation': 'execution_tier',
        'testing': 'execution_tier',
        
        // Utility tasks
        'simple_tasks': 'utility_tier',
        'validation': 'utility_tier',
        'formatting': 'utility_tier'
    };
    
    return useCaseMapping[useCase] || null;
}

// Get available execution options for development tasks
export function getExecutionOptions() {
    return config.execution_options || {};
}

// Select best execution method based on task complexity and user preference
export function selectExecutionMethod(taskComplexity = 'medium', userPreference = null) {
    const options = getExecutionOptions();
    
    if (userPreference && options[userPreference]?.enabled) {
        return userPreference;
    }
    
    // Auto-select based on task complexity
    const complexityMapping = {
        'simple': 'internal_dev',
        'medium': 'gemini_cli', 
        'complex': 'qwen_cli',
        'algorithm': 'qwen_cli'
    };
    
    return complexityMapping[taskComplexity] || 'internal_dev';
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
