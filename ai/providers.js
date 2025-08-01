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
