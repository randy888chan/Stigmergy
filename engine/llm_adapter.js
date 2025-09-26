import { generateObject } from 'ai';
import { z } from 'zod';
import { getAiProviders } from "../ai/providers.js";
import config from "../stigmergy.config.js"; // Import config

export async function generateStructuredOutput(prompt, schema, tier = 'b_tier', { getModelForTier = getAiProviders().getModelForTier } = {}) {
  const model = getModelForTier(tier, config); // Pass config
  const { object } = await generateObject({
    model: model,
    prompt: prompt,
    schema: schema,
  });
  return object;
}

export async function generateText(prompt, tier = 'b_tier', { getModelForTier = getAiProviders().getModelForTier } = {}) {
  const model = getModelForTier(tier, config); // Pass config
  // Assuming a simple text generation for now, not structured.
  // In a real scenario, you might use generateText from 'ai' or a similar function.
  const { text } = await generateObject({
    model: model,
    prompt: prompt,
    schema: z.object({
      text: z.string(),
    }),
  });
  return text;
}