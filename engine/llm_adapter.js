import fs from "fs-extra";
import path from "path";
import { enhance as enhanceContext } from "./context_enhancer.js";
import { getModelForTier } from "../ai/providers.js";
import "dotenv/config.js";
import yaml from 'js-yaml';
import config from "../stigmergy.config.js";

let llm;

// Provider Context Management
const PROVIDER_CONTEXTS = {
  STIGMERGY: 'stigmergy_internal',
  ROO_CODE: 'roo_code_external',
  EXTERNAL_IDE: 'external_ide'
};

let currentProviderContext = PROVIDER_CONTEXTS.STIGMERGY;

// Cost tracking
let totalCost = 0;
let dailyCost = 0;
let providerCosts = {};
let dailyCostHistory = []; // Store daily cost history for charting

// Initialize daily cost history with today's date
const today = new Date().toISOString().split('T')[0];
dailyCostHistory.push({ date: today, cost: 0 });

const META_PROMPT_PATH = path.join(
  process.cwd(),
  ".stigmergy-core",
  "utils",
  "meta_prompt_template.md"
);

const fileCache = new Map();

// Pricing information for different models (per 1M tokens)
const MODEL_PRICING = {
  // OpenAI models
  'gpt-4': { input: 30.00, output: 60.00 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'gpt-4o': { input: 5.00, output: 15.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  
  // Google models
  'gemini-pro': { input: 0.50, output: 1.50 },
  'gemini-1.5-pro': { input: 7.00, output: 21.00 },
  'gemini-1.5-flash': { input: 0.35, output: 1.05 },
  
  // Anthropic models
  'claude-3-opus': { input: 15.00, output: 75.00 },
  'claude-3-sonnet': { input: 3.00, output: 15.00 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  
  // Mistral models
  'mistral-large': { input: 8.00, output: 24.00 },
  'mistral-medium': { input: 2.70, output: 8.10 },
  
  // DeepSeek models
  'deepseek-chat': { input: 0.14, output: 0.28 },
  'deepseek-coder': { input: 0.14, output: 0.28 },
  
  // Default pricing for unknown models
  'default': { input: 1.00, output: 3.00 }
};

export async function getCachedFile(filePath) {
  if (fileCache.has(filePath)) {
    return fileCache.get(filePath);
  }
  if (await fs.pathExists(filePath)) {
    const content = await fs.readFile(filePath, "utf8");
    fileCache.set(filePath, content);
    return content;
  }
  return null;
}

export async function getSharedContext() {
  const docs = [
    ".stigmergy-core/system_docs/00_System_Goal.md",
    ".stigmergy-core/system_docs/01_System_Architecture.md",
    ".stigmergy-core/system_docs/03_Core_Principles.md",
    ".stigmergy-core/system_docs/04_System_State_Schema.md",
    "docs/brief.md",
    "docs/prd.md",
    "docs/architecture.md",
    "docs/architecture/tech-stack.md",
    "docs/architecture/coding-standards.md",
  ];
  let context = "";
  for (const docPath of docs) {
    const fullPath = path.join(process.cwd(), docPath);
    const content = await getCachedFile(fullPath);
    if (content) {
      context += `--- START ${docPath} ---
${content}
--- END ${docPath} ---

`;
    }
  }
  return context;
}

export function setProviderContext(context) {
  if (Object.values(PROVIDER_CONTEXTS).includes(context)) {
    currentProviderContext = context;
    console.log(`[LLM Adapter] Provider context set to: ${context}`);
  }
}

export function getProviderContext() {
  return currentProviderContext;
}

export function getCostTracking() {
  // Update daily cost history
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = dailyCostHistory.find(entry => entry.date === today);
  
  if (!todayEntry) {
    // Add new entry for today
    dailyCostHistory.push({ date: today, cost: dailyCost });
    
    // Keep only the last 30 days
    if (dailyCostHistory.length > 30) {
      dailyCostHistory.shift();
    }
  } else {
    // Update today's cost
    todayEntry.cost = dailyCost;
  }
  
  return {
    totalCost,
    dailyCost,
    providerCosts,
    dailyCostHistory
  };
}

export function calculateCost(modelName, inputTokens, outputTokens) {
  // Normalize model name to handle variations
  const normalizedModelName = modelName.toLowerCase();
  let pricing = MODEL_PRICING[normalizedModelName];
  
  // If exact match not found, try to find a partial match
  if (!pricing) {
    const modelKeys = Object.keys(MODEL_PRICING);
    const matchedKey = modelKeys.find(key => normalizedModelName.includes(key));
    pricing = MODEL_PRICING[matchedKey] || MODEL_PRICING['default'];
  }
  
  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  return inputCost + outputCost;
}

export function trackCost(modelName, inputTokens, outputTokens) {
  const cost = calculateCost(modelName, inputTokens, outputTokens);
  totalCost += cost;
  dailyCost += cost;
  
  if (!providerCosts[modelName]) {
    providerCosts[modelName] = 0;
  }
  providerCosts[modelName] += cost;
  
  console.log(`[LLM Adapter] Tracked cost: $${cost.toFixed(6)} for ${modelName} (${inputTokens} input, ${outputTokens} output tokens)`);
  return cost;
}

export async function getCompletion(agentId, prompt, options = {}) {
  // Check if we're in external IDE context and should defer
  if (currentProviderContext === PROVIDER_CONTEXTS.ROO_CODE && !options.forceInternal) {
    console.log(`[LLM Adapter] Deferring to Roo Code for agent ${agentId}`);
    return {
      thought: `Routing request through Roo Code IDE for ${agentId}`,
      action: "external_ide_routing",
      provider_context: currentProviderContext
    };
  }

  // Check provider isolation feature flag
  if (config.features?.provider_isolation && currentProviderContext !== PROVIDER_CONTEXTS.STIGMERGY) {
    console.log(`[LLM Adapter] Provider isolation enabled, context: ${currentProviderContext}`);
  }
  const agentPath = path.join(process.cwd(), '.stigmergy-core', 'agents', `${agentId}.md`);
  const agentDef = await fs.readFile(agentPath, 'utf-8');
  const agentConfig = yaml.load(agentDef.match(/```yaml\n([\s\S]*?)\n```/)[1]).agent;

  const modelTier = agentConfig.model_tier || 'b_tier'; // Default to cheapest tier
  const llm = getModelForTier(modelTier);

  // Enhanced system prompt with context awareness
  const systemPrompt = `You are ${agentId}. 
Provider Context: ${currentProviderContext}
${currentProviderContext === PROVIDER_CONTEXTS.EXTERNAL_IDE ? 
  'You are operating through an external IDE. Be concise and focused.' : 
  'You are operating in autonomous mode.'}
Respond in JSON format: {thought, action}`;

  try {
    const response = await llm.generate({
      system: systemPrompt,
      prompt: prompt
    });

    let rawJSON = response.text;
    if (!rawJSON && response.choices && response.choices.length > 0) {
      rawJSON = response.choices[0].message.content;
    }

    // Track token usage and cost if available
    if (response.usage) {
      const modelName = response.model || 'unknown';
      const inputTokens = response.usage.promptTokens || 0;
      const outputTokens = response.usage.completionTokens || 0;
      trackCost(modelName, inputTokens, outputTokens);
    }

    if (!rawJSON) {
      console.error("LLM response did not contain expected text or content field:", response);
      return { thought: "Error: Received an empty response from the LLM.", action: null };
    }

    try {
      const jsonMatch = rawJSON.match(/```(?:json)?\n([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return JSON.parse(rawJSON);
    } catch {
      return {
        thought: "My response wasn't valid JSON. Please try again.",
        action: null
      };
    }
  } catch (error) {
    console.error(`LLM Adapter error: ${error.message}`, error);
    return {
      thought: `I encountered an error: ${error.message}`,
      action: null
    };
  }
}

export async function getSystemPrompt() {
  return `You are @system, the primary assistant. You can:
  1. Setup projects: "Install Stigmergy here"
  2. Start development: "Create a blog platform"
  3. Manage execution: "Pause", "Status"
  4. Explain agents: "Who is @saul?"

  Other agents specialize in:
  - @saul: Workflow coordination
  - @mary: Market research
  - @gemma: Code generation`;
}

export function clearFileCache() {
  fileCache.clear();
  console.log("[LLM Adapter] File cache cleared.");
}

/**
 * Decomposes a high-level goal into a series of smaller, actionable tasks.
 * @param {string} goal The high-level goal to decompose.
 * @returns {Promise<Array<object>>} A list of tasks.
 */
export async function decomposeGoal(goal) {
  // This is a placeholder for a more advanced goal decomposition implementation.
  // In a real system, this would involve a more sophisticated LLM prompt
  // and a more structured output format.
  console.log(`Decomposing goal: ${goal}`);
  return [
    { id: "task1", description: "First task" },
    { id: "task2", description: "Second task" },
  ];
}