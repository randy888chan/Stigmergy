import fs from "fs-extra";
import path from "path";
import { enhance as enhanceContext } from "./context_enhancer.js";
import { getModelForTier } from "../ai/providers.js";
import "dotenv/config.js";
import yaml from 'js-yaml';

let llm;

const META_PROMPT_PATH = path.join(
  process.cwd(),
  ".stigmergy-core",
  "utils",
  "meta_prompt_template.md"
);

const fileCache = new Map();

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
      context += `--- START ${docPath} ---\n${content}\n--- END ${docPath} ---\n\n`;
    }
  }
  return context;
}

export async function getCompletion(agentId, prompt) {
  const agentPath = path.join(process.cwd(), '.stigmergy-core', 'agents', `${agentId}.md`);
  const agentDef = await fs.readFile(agentPath, 'utf-8');
  const agentConfig = yaml.load(agentDef.match(/```yaml\n([\s\S]*?)\n```/)[1]).agent;

  const modelTier = agentConfig.model_tier || 'b_tier'; // Default to cheapest tier
  const llm = getModelForTier(modelTier);

  const systemPrompt = `You are ${agentId}. Respond in JSON format: {thought, action}`;

  try {
    const response = await llm.generate({
      system: systemPrompt,
      prompt: prompt
    });

    let rawJSON = response.text;
    if (!rawJSON && response.choices && response.choices.length > 0) {
      rawJSON = response.choices[0].message.content;
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
