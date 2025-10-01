import { generateObject, generateText as vercelGenerateText } from 'ai';

export async function generateStructuredOutput(prompt, schema, ai, tier = 'utility_tier', config) {
  // CORRECT PATTERN: Get both client and modelName, then create the model instance.
  const { client, modelName } = ai.getModelForTier(tier, null, config);
  const model = client(modelName);

  const { object } = await generateObject({
    model: model,
    prompt: prompt,
    schema: schema,
  });
  return object;
}

export async function generateText(prompt, ai, tier = 'utility_tier', config) {
  // CORRECT PATTERN: Get both client and modelName, then create the model instance.
  const { client, modelName } = ai.getModelForTier(tier, null, config);
  const model = client(modelName);

  // We use generateText from 'ai' for this now.
  const { text } = await vercelGenerateText({
    model: model,
    prompt: prompt,
  });
  return text;
}

// Cache management for file operations
export function clearFileCache() {
  // In a real implementation, this would clear any cached file data
  // For now, this is a placeholder implementation
  console.log('[LLM Adapter] File cache cleared');
}