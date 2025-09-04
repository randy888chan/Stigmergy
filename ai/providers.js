import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import "../utils/env_loader.js";  // Load environment with inheritance
import config from '../stigmergy.config.js';

// A cache for provider instances to avoid re-creating them on every call
let providerInstances = {};

// Exported for testing purposes to reset the cache between tests
export function _resetProviderInstances() {
    providerInstances = {};
}

// Enhanced model selection with reasoning vs non-reasoning intelligence
export function getModelForTier(tier = 'utility_tier', useCase = null) {
    console.log(`[AI Provider] Getting model for tier: ${tier}`);
    
    const tierConfig = config.model_tiers[tier];
    if (!tierConfig) {
        const availableTiers = Object.keys(config.model_tiers);
        const semanticTiers = availableTiers.filter(t => !t.endsWith('_tier') || t.match(/^(reasoning|strategic|execution|utility)_tier$/));
        const errorMsg = (
            `Model tier '${tier}' is not defined in stigmergy.config.js.\n` +
            `Available semantic tiers: ${semanticTiers.join(', ')}\n` +
            `Available legacy tiers: ${availableTiers.filter(t => t.match(/^[abc]_tier$/)).join(', ')}\n` +
            `All available tiers: ${availableTiers.join(', ')}`
        );
        console.error(`[AI Provider] ${errorMsg}`);
        throw new Error(errorMsg);
    }

    console.log(`[AI Provider] Tier config found:`, {
        provider: tierConfig.provider,
        model_name: tierConfig.model_name
    });

    // If use case is provided, try to find a better matching tier
    if (useCase) {
        const betterTier = findOptimalTierForUseCase(useCase);
        if (betterTier && betterTier !== tier) {
            console.log(`[AI Provider] Optimizing tier: ${tier} → ${betterTier} for use case: ${useCase}`);
            return getModelForTier(betterTier, null); // Avoid recursion
        }
    }

    // Extract configuration, handling both static values and function results
    const { provider, model_name } = tierConfig;
    
    // Handle api_key_env - can be a string or function result
    const api_key_env = typeof tierConfig.api_key_env === 'function' 
        ? tierConfig.api_key_env() 
        : tierConfig.api_key_env;
    
    // Handle base_url_env - can be a string, null, or function result
    const base_url_env = typeof tierConfig.base_url_env === 'function' 
        ? tierConfig.base_url_env() 
        : tierConfig.base_url_env;

    console.log(`[AI Provider] Resolved config:`, {
        provider,
        model_name,
        api_key_env,
        base_url_env
    });

    if (!api_key_env || !model_name) {
        const errorMsg = (
            `Tier '${tier}' configuration is incomplete. ` +
            `Missing: ${!api_key_env ? 'api_key_env' : ''} ${!model_name ? 'model_name' : ''}. ` +
            `Please check your stigmergy.config.js file.`
        );
        console.error(`[AI Provider] ${errorMsg}`);
        throw new Error(errorMsg);
    }

    // Get API key and base URL from environment
    const apiKey = process.env[api_key_env];
    const baseURL = base_url_env ? process.env[base_url_env] : null;

    console.log(`[AI Provider] Environment check:`, {
        api_key_env,
        apiKey: apiKey ? `${apiKey.slice(0, 8)}...` : 'MISSING',
        base_url_env,
        baseURL: baseURL || 'none'
    });

    if (!apiKey) {
        const suggestion = getSuggestionForProvider(provider);
        const errorMsg = (
            `API key environment variable '${api_key_env}' for tier '${tier}' is not set. ` +
            `${suggestion}`
        );
        console.error(`[AI Provider] ${errorMsg}`);
        throw new Error(errorMsg);
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
                // Default to OpenAI-compatible (includes OpenRouter, DeepSeek, Kimi, Mistral, etc.)
                // For OpenRouter and similar providers, ensure compatibility settings
                if (provider === 'openrouter' || baseURL?.includes('openrouter')) {
                    providerOptions.compatibility = 'strict';
                }
                providerInstances[cacheKey] = createOpenAI(providerOptions);
            }
            console.log(`[AI Provider] Successfully initialized ${provider} provider`);
        } catch (error) {
            const errorMsg = `Failed to initialize ${provider} provider for tier '${tier}': ${error.message}`;
            console.error(`[AI Provider] ${errorMsg}`);
            throw new Error(errorMsg);
        }
    }

    const providerInstance = providerInstances[cacheKey];
    console.log(`[AI Provider] Using Model: ${model_name} (Tier: ${tier}, Provider: ${provider})`);
    
    const modelInstance = providerInstance(model_name);
    console.log(`[AI Provider] Model instance created successfully`);
    
    return modelInstance;
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
        'mistral': 'Get your API key at https://console.mistral.ai/api-keys/',
        'anthropic': 'Get your API key at https://console.anthropic.com/account/keys',
        'together': 'Get your API key at https://api.together.ai/settings/api-keys',
        'groq': 'Get your API key at https://console.groq.com/keys',
        'google': 'Get your API key at https://aistudio.google.com/app/apikey',
        'openai': 'Get your API key at https://platform.openai.com/api-keys'
    };
    
    return suggestions[provider] || 'Please check your provider documentation for API key setup.';
}

// Validate provider configuration
export function validateProviderConfig() {
    const errors = [];
    const warnings = [];
    
    // Check if at least one provider is properly configured
    const hasGoogle = !!process.env.GOOGLE_API_KEY;
    const hasOpenRouter = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_BASE_URL);
    
    if (!hasGoogle && !hasOpenRouter) {
        errors.push('No AI providers are configured. Set up either Google AI (GOOGLE_API_KEY) or OpenRouter (OPENROUTER_API_KEY + OPENROUTER_BASE_URL)');
    }
    
    // Check each tier configuration
    for (const [tierName, tierConfig] of Object.entries(config.model_tiers)) {
        try {
            const { provider, model_name } = tierConfig;
            
            // Extract environment variable names (handle functions)
            const api_key_env = typeof tierConfig.api_key_env === 'function' 
                ? tierConfig.api_key_env() 
                : tierConfig.api_key_env;
            const base_url_env = typeof tierConfig.base_url_env === 'function' 
                ? tierConfig.base_url_env() 
                : tierConfig.base_url_env;
            
            if (!provider || !api_key_env || !model_name) {
                errors.push(`Tier '${tierName}' is missing required fields: provider, api_key_env, model_name`);
                continue;
            }
            
            // Check if required environment variables are set
            if (!process.env[api_key_env]) {
                warnings.push(`API key '${api_key_env}' for tier '${tierName}' is not set`);
            }
            
            if (base_url_env && !process.env[base_url_env]) {
                warnings.push(`Base URL '${base_url_env}' for tier '${tierName}' is not set`);
            }
            
        } catch (error) {
            errors.push(`Error validating tier '${tierName}': ${error.message}`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        summary: {
            totalTiers: Object.keys(config.model_tiers).length,
            googleConfigured: hasGoogle,
            openRouterConfigured: hasOpenRouter
        }
    };
}

// Get configuration summary for debugging
export function getProviderSummary() {
    const validation = validateProviderConfig();
    const tiers = Object.keys(config.model_tiers);
    const semantic = tiers.filter(t => t.match(/^(reasoning|strategic|execution|utility)_tier$/));
    const legacy = tiers.filter(t => t.match(/^[abcs]_tier$/));
    
    return {
        validation,
        tiers: {
            total: tiers.length,
            semantic: semantic.length,
            legacy: legacy.length,
            list: {
                semantic,
                legacy,
                other: tiers.filter(t => !semantic.includes(t) && !legacy.includes(t))
            }
        },
        providers: {
            configured: validation.summary.googleConfigured || validation.summary.openRouterConfigured,
            google: validation.summary.googleConfigured,
            openRouter: validation.summary.openRouterConfigured
        }
    };
}
