import { getEstimatedCost } from 'llm-cost-calculator';

export async function generateStructuredOutput(prompt, schema, ai, tier = 'utility_tier', config, engine) {
  const { client, modelName, provider } = ai.getModelForTier(tier, null, config);
  const model = client(modelName);

  let generateObject;
  if (provider === 'google') {
    ({ generateObject } = await import('@ai-sdk/google'));
  } else {
    ({ generateObject } = await import('@ai-sdk/openai'));
  }

  const { object, usage } = await generateObject({
    model: model,
    prompt: prompt,
    schema: schema,
  });

  const costResult = await getEstimatedCost({
    model: modelName,
    input: prompt,
    output: JSON.stringify(object),
  });
  const cost = costResult.cost;
  if (engine) {
    engine.sessionCost += cost;
  }

  return { object, cost: { last: cost, total: engine ? engine.sessionCost : 0 } };
}

export async function generateText(prompt, ai, tier = 'utility_tier', config, engine) {
  const { client, modelName, provider } = ai.getModelForTier(tier, null, config);
  const model = client(modelName);

  let generateText;
  if (provider === 'google') {
    ({ generateText } = await import('@ai-sdk/google'));
  } else {
    ({ generateText } = await import('@ai-sdk/openai'));
  }

  const { text, usage } = await generateText({
    model: model,
    prompt: prompt,
  });

  const costResult = await getEstimatedCost({
    model: modelName,
    input: prompt,
    output: text,
  });
  const cost = costResult.cost;
  if (engine) {
    engine.sessionCost += cost;
  }

  return { text, cost: { last: cost, total: engine ? engine.sessionCost : 0 } };
}

export function clearFileCache() {
  console.log('[LLM Adapter] File cache cleared');
}
