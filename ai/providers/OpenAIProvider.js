import { createOpenAI } from "@ai-sdk/openai";
import { BaseProvider } from "./BaseProvider.js";

export class OpenAIProvider extends BaseProvider {
getClient() {
const options = { apiKey: this.config.apiKey };
if (this.config.baseURL) {
// Defensively remove trailing /v1, as the SDK often adds it.
options.baseURL = this.config.baseURL.replace(/\/v1$/, '');
}
if (this.config.provider === 'openrouter' || options.baseURL?.includes('openrouter')) {
options.compatibility = 'strict';
}
return createOpenAI(options);
}
}