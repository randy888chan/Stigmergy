import { generateObject } from 'ai';
import { z } from 'zod';

export async function generateStructuredOutput(prompt, schema, ai, tier = 'utility_tier', config) {
  const model = ai.getModelForTier(tier, null, config); // Pass config
  const { object } = await generateObject({
    model: model,
    prompt: prompt,
    schema: schema,
  });
  return object;
}

export async function generateText(prompt, ai, tier = 'utility_tier', config) {
  const model = ai.getModelForTier(tier, null, config); // Pass config
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

// Cache management for file operations
export function clearFileCache() {
  // In a real implementation, this would clear any cached file data
  // For now, this is a placeholder implementation
  console.log('[LLM Adapter] File cache cleared');
}