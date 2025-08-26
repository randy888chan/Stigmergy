import { createOpenAI } from "@ai-sdk/openai";
import "dotenv/config.js";
import config from '../stigmergy.config.js';

const providers = {};

function getProvider(apiKey, baseURL) {
    const key = `${apiKey}-${baseURL || 'default'}`;
    if (!providers[key]) {
        providers[key] = createOpenAI({ apiKey, baseURL });
    }
    return providers[key];
}

export function getModelForTier(tier = 'b_tier') {
    const tierConfig = config.model_tiers[tier];
    if (!tierConfig || !tierConfig.provider_env_key || !tierConfig.model_name) {
        throw new Error(`Model tier '${tier}' is not fully configured in stigmergy.config.js`);
    }

    const apiKey = process.env[tierConfig.provider_env_key];
    const baseURL = process.env.AI_API_BASE_URL; // Use a single base URL for simplicity with OpenRouter

    if (!apiKey) {
        throw new Error(`API key specified by '${tierConfig.provider_env_key}' for tier '${tier}' is not set in your .env file.`);
    }

    console.log(`[AI Provider] Using Model: ${tierConfig.model_name} (Tier: ${tier})`);
    const provider = getProvider(apiKey, baseURL);
    return provider(tierConfig.model_name);
}
