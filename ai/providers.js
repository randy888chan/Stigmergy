import { createProvider } from './providerFactory.js';

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

const apiKey = process.env[tierConfig.api_key_env];
const baseURL = tierConfig.base_url_env ? process.env[tierConfig.base_url_env] : null;

const cacheKey = `${tier}-${apiKey?.slice(-4)}-${baseURL || 'default'}`;

if (!providerInstances[cacheKey]) {
providerInstances[cacheKey] = createProvider(tierConfig);
}

const providerInstance = providerInstances[cacheKey];
return {
client: providerInstance.getClient(),
modelName: tierConfig.model_name
};
}

export function getAiProviders(config) {
return {
getModelForTier: (tier, useCase) => getModelForTier(tier, useCase, config),
};
}