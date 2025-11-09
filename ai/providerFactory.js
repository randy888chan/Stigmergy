import { GoogleProvider } from './providers/GoogleProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';

export function createProvider(config) {
const providerOptions = {
apiKey: process.env[config.api_key_env],
baseURL: config.base_url_env ? process.env[config.base_url_env] : null,
provider: config.provider,
};

if (!providerOptions.apiKey) {
throw new Error(`API key environment variable '${config.api_key_env}' for provider '${config.provider}' is not set.`);
}

switch (config.provider) {
case 'google':
return new GoogleProvider(providerOptions);
case 'openai':
case 'openrouter':
case 'mistral':
case 'codestral':
// Any other OpenAI-compatible provider
default:
return new OpenAIProvider(providerOptions);
}
}