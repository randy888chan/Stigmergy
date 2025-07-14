const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

// Load environment variables from .env file
require('dotenv').config();

// Initialize the OpenAI client with configuration from environment variables.
// This allows pointing to any OpenAI-compatible API.
const openai = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
});

const META_PROMPT_PATH = path.join(__dirname, '..', '.stigmergy-core', 'utils', 'meta_prompt_template.md');
const MANIFEST_PATH = path.join(__dirname, '..', '.stigmergy-core', 'system_docs', '02_Agent_Manifest.md');

// Cache the manifest to avoid repeated file reads
let agentManifest = null;
async function getAgentManifest() {
    if (!agentManifest) {
        const manifestContent = await fs.readFile(MANIFEST_PATH, 'utf-8');
        agentManifest = yaml.load(manifestContent);
    }
    return agentManifest;
}

async function getCompletion(agentId, prompt) {
  const agentPath = path.join(__dirname, '..', '.stigmergy-core', 'agents', `${agentId}.md`);
  if (!await fs.pathExists(agentPath)) {
      throw new Error(`Agent file not found for agentId: ${agentId}`);
  }

  const manifest = await getAgentManifest();
  const agentConfig = manifest.agents.find(a => a.id === agentId);
  
  // Determine which model to use, defaulting to a standard model
  const modelToUse = agentConfig?.model_preference || 'gpt-4-turbo';
  
  const agentInstructions = await fs.readFile(agentPath, 'utf-8');
  const metaPromptTemplate = await fs.readFile(META_PROMPT_PATH, 'utf-8');
  
  const finalSystemPrompt = metaPromptTemplate.replace('{{AGENT_INSTRUCTIONS}}', agentInstructions);

  console.log(`[LLM Adapter] Getting completion for '${agentId}' using model '${modelToUse}'...`);

  const response = await openai.chat.completions.create({
    model: modelToUse,
    messages: [
      { role: "system", content: finalSystemPrompt },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("[LLM Adapter] Failed to parse LLM JSON response:", content);
    return { thought: "The model did not return valid JSON. The raw response was: " + content, action: null };
  }
}

module.exports = { getCompletion };
