import { createOpenAI } from "@ai-sdk/openai";
import "dotenv/config.js";
import config from '../stigmergy.config.js';

// Store provider instances to avoid re-creation
const providers = {};

function getProvider(apiKey, baseURL) {
    const key = `${apiKey}-${baseURL}`;
    if (!providers[key]) {
        providers[key] = createOpenAI({ apiKey, baseURL });
    }
    return providers[key];
}

export function getModelForTier(tier) {
    const tierConfig = config.model_tiers[tier];
    if (!tier || !tierConfig || !tierConfig.api_key || !tierConfig.model_name) {
        console.warn(`Warning: Tier '${tier}' is not fully configured or specified. Falling back to default AI_MODEL.`);
        // Fallback to legacy environment variables
        const { AI_API_KEY, AI_API_BASE_URL, AI_MODEL } = process.env;
        if (!AI_API_KEY || !AI_MODEL) throw new Error("Default AI model is not configured in .env");
        const provider = getProvider(AI_API_KEY, AI_API_BASE_URL);
        return provider(AI_MODEL);
    }

    const provider = getProvider(tierConfig.api_key, tierConfig.base_url); // Assuming base_url is in config
    return provider(tierConfig.model_name);
}

export function getModel() {
    return getModelForTier(null);
}
