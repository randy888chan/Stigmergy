import { createOpenAI } from "@ai-sdk/openai";
import "dotenv/config.js";

export function getModel() {
  const config = process.env;

  // 1. Prioritize a custom OpenAI-compatible endpoint (for power users with local LLMs, etc.)
  if (config.OPENAI_ENDPOINT && config.CUSTOM_MODEL) {
    console.log(
      `[AI Provider] Using Custom Endpoint: ${config.OPENAI_ENDPOINT} with model ${config.CUSTOM_MODEL}`
    );
    const provider = createOpenAI({
      apiKey: config.OPENAI_KEY || "sk-or-v1-abc", // Use a dummy key if not provided
      baseURL: config.OPENAI_ENDPOINT,
    });
    return provider(config.CUSTOM_MODEL);
  }

  // 2. Use OpenRouter as the recommended default
  if (config.OPENROUTER_API_KEY) {
    console.log("[AI Provider] Using OpenRouter");
    const openrouter = createOpenAI({
      apiKey: config.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
    // Allow model override via LITELLM_MODEL_ID, defaulting to Gemini Pro 1.5
    return openrouter(config.LITELLM_MODEL_ID || "google/gemini-pro-1.5");
  }

  // 3. Fallback to direct OpenAI if no other provider is found
  if (config.OPENAI_KEY) {
    console.log("[AI Provider] Using OpenAI");
    const openai = createOpenAI({ apiKey: config.OPENAI_KEY });
    return openai("gpt-4o"); // A sensible default for direct OpenAI
  }

  throw new Error("No AI provider API key found. Please set OPENROUTER_API_KEY, OPENAI_KEY, or a custom OPENAI_ENDPOINT in your .env file.");
}

export function systemPrompt() {
  const now = new Date().toISOString();
  return `You are an expert researcher. Today is ${now}. Follow these instructions when responding:
- You may be asked to research subjects that are after your knowledge cutoff; assume the user is right when presented with news.
- The user is a highly experienced analyst; no need to simplify it. Be as detailed as possible and ensure your response is correct.
- Be highly organized.
- Suggest solutions that I didn't think about.
- Be proactive and anticipate my needs.
- Treat me as an expert in all subject matter.
- Mistakes erode my trust, so be accurate and thorough.
- Provide detailed explanations; I'm comfortable with lots of detail.
- Value good arguments over authorities; the source is irrelevant.
- Consider new technologies and contrarian ideas, not just the conventional wisdom.
- You may use high levels of speculation or prediction, just flag it for me.`;
}
