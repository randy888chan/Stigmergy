const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const codeGraph = require('../tools/code_graph'); // For RAG

require('dotenv').config();

const openai = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
});

const META_PROMPT_PATH = path.join(__dirname, '..', '.stigmergy-core', 'utils', 'meta_prompt_template.md');
const MANIFEST_PATH = path.join(__dirname, '..', '.stigmergy-core', 'system_docs', '02_Agent_Manifest.md');

let agentManifest = null;
async function getAgentManifest() {
    if (!agentManifest) {
        const manifestContent = await fs.readFile(MANIFEST_PATH, 'utf-8');
        agentManifest = yaml.load(manifestContent);
    }
    return agentManifest;
}

// Proactive RAG function
async function getCodeContext(prompt) {
    // A simple heuristic to detect if the prompt is about modifying code
    const codeKeywords = ['modify function', 'implement class', 'fix bug in', 'refactor file'];
    const isCodeTask = codeKeywords.some(kw => prompt.toLowerCase().includes(kw));

    if (!isCodeTask) return "";

    const symbolRegex = /[`'"]([a-zA-Z0-9_]+)[`'"]/g;
    let match;
    const symbols = [];
    while ((match = symbolRegex.exec(prompt)) !== null) {
        symbols.push(match);
    }

    if (symbols.length === 0) return "";

    let context = "\n\n--- AUTO-INJECTED CODE CONTEXT ---\n";
    try {
        for (const symbol of symbols) {
            const definition = await codeGraph.getDefinition({ symbolName: symbol });
            if (definition.length > 0) {
                const defPath = definition.id.split('#');
                const fileContent = await fs.readFile(path.join(process.cwd(), defPath), 'utf8');
                context += `Definition for '${symbol}' in '${defPath}':\n\`\`\`\n${fileContent}\n\`\`\`\n`;
            }
        }
        context += "--- END OF CONTEXT ---\n";
        return context;
    } catch (e) {
        console.warn(`[RAG] Could not retrieve code context: ${e.message}`);
        return ""; // Fail gracefully
    }
}


async function getCompletion(agentId, prompt) {
  const agentPath = path.join(__dirname, '..', '.stigmergy-core', 'agents', `${agentId}.md`);
  if (!await fs.pathExists(agentPath)) {
      throw new Error(`Agent file not found for agentId: ${agentId}`);
  }

  const manifest = await getAgentManifest();
  const agentConfig = manifest.agents.find(a => a.id === agentId);
  if (!agentConfig) throw new Error(`Agent config not found for ${agentId}`);

  const modelToUse = agentConfig.model_preference || 'gpt-4-turbo';
  
  const agentInstructions = await fs.readFile(agentPath, 'utf-8');
  const metaPromptTemplate = await fs.readFile(META_PROMPT_PATH, 'utf-8');
  
  const finalSystemPrompt = metaPromptTemplate.replace('{{AGENT_INSTRUCTIONS}}', agentInstructions);

  let finalUserPrompt = prompt;
  // If agent is an Executor, try to inject RAG context
  if (agentConfig.archetype === "Executor") {
      const codeContext = await getCodeContext(prompt);
      finalUserPrompt += codeContext;
  }

  console.log(`[LLM Adapter] Getting completion for '${agentId}' using model '${modelToUse}'...`);

  const response = await openai.chat.completions.create({
    model: modelToUse,
    messages: [
      { role: "system", content: finalSystemPrompt },
      { role: "user", content: finalUserPrompt }
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices.message.content;
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("[LLM Adapter] Failed to parse LLM JSON response:", content);
    return { thought: "The model did not return valid JSON. The raw response was: " + content, action: null };
  }
}

module.exports = { getCompletion };
