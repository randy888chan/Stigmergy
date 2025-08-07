import { createOpenAI } from "@ai-sdk/openai";
import "dotenv/config.js";

export function getModel() {
  const { AI_API_KEY, AI_API_BASE_URL, AI_MODEL } = process.env;

  if (!AI_API_KEY || !AI_MODEL) {
    throw new Error(
      "Missing AI configuration. Please set AI_API_KEY and AI_MODEL in your .env file."
    );
  }

  const providerConfig = {
    apiKey: AI_API_KEY,
  };

  if (AI_API_BASE_URL) {
    providerConfig.baseURL = AI_API_BASE_URL;
  }

  console.log(
    `[AI Provider] Initializing with model "${AI_MODEL}"` +
      (AI_API_BASE_URL ? ` at ${AI_API_BASE_URL}` : "")
  );

  const provider = createOpenAI(providerConfig);

  return provider(AI_MODEL);
}
