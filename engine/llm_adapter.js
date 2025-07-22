const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const codeGraph = require('../tools/code_graph'); // Neo4j tool

require('dotenv').config();

const openai = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
});

const META_PROMPT_PATH = path.join(__dirname, '..', '.stigmergy-core', 'utils', 'meta_prompt_template.md');
const MANIFEST_PATH = path.join(__dirname, '..', '.stigmergy-core', 'system_docs', '02_Agent_Manifest.md');
const SHARED_CONTEXT_PATH = path.join(process.cwd(), '.ai', 'project_context.md');

let agentManifest = null;
async function getAgentManifest() {
    if (!agentManifest) {
        const manifestContent = await fs.readFile(MANIFEST_PATH, 'utf-8');
        agentManifest = yaml.load(manifestContent);
    }
    return agentManifest;
}

// --- NEW: CODE-RAG CONTEXT INJECTION ---
async function getCodeGraphContext(prompt) {
    const symbolRegex = /[`'"]([a-zA-Z0-9_./#]+)[`'"]/g;
    let match;
    const symbols = new Set();
    while ((match = symbolRegex.exec(prompt)) !== null) {
        if (!match[1].endsWith('.md') && !match[1].endsWith('.yml')) { // Avoid matching doc files
           symbols.add(match[1].split('#').pop());
        }
    }

    if (symbols.size === 0) return "";

    let context = "\n\n--- AUTO-INJECTED CODE-GRAPH CONTEXT ---\n";
    try {
        for (const symbol of symbols) {
            const definition = await codeGraph.getDefinition({ symbolName: symbol });
            if (definition.length > 0 && definition[0].id) {
                const defPath = definition[0].id.split('#')[0];
                const fileNode = { id: defPath, name: path.basename(defPath) }; // simplified node
                const usages = await codeGraph.findUsages({ symbolName: symbol });

                context += `Context for symbol '${symbol}':\n`;
                context += `  - DEFINED IN: ${fileNode.name}\n`;
                if(usages.length > 0) {
                    context += `  - USED IN: ${usages.map(u => path.basename(u.user)).join(', ')}\n`;
                }
                const fileContent = await fs.readFile(path.join(process.cwd(), defPath), 'utf8');
                context += `\n\`\`\`${path.extname(defPath).substring(1)}\n${fileContent}\n\`\`\`\n\n`;
            }
        }
        context += "--- END OF CONTEXT ---\n";
        return context.length > 100 ? context : ""; // Only add if substantial
    } catch (e) {
        console.warn(chalk.yellow(`[CodeGraph] Could not retrieve context: ${e.message}. Is Neo4j running?`));
        return "";
    }
}


async function getCompletion(agentId, prompt, taskId) {
  const agentPath = path.join(__dirname, '..', '.stigmergy-core', 'agents', `${agentId}.md`);
  if (!await fs.pathExists(agentPath)) throw new Error(`Agent file not found: ${agentId}`);

  const manifest = await getAgentManifest();
  const agentConfig = manifest.agents.find(a => a.id === agentId);
  if (!agentConfig) throw new Error(`Agent config not found for ${agentId}`);

  const modelToUse = agentConfig.model_preference || 'gpt-4-turbo';
  const agentInstructions = await fs.readFile(agentPath, 'utf-8');
  const metaPromptTemplate = await fs.readFile(META_PROMPT_PATH, 'utf-8');
  
  // --- NEW: Inject shared project context and story context ---
  let sharedContext = "";
  if (await fs.pathExists(SHARED_CONTEXT_PATH)) {
      sharedContext += await fs.readFile(SHARED_CONTEXT_PATH, 'utf8');
  }
  if (taskId) {
      const storyPath = path.join(process.cwd(), '.ai', 'stories', `${taskId}.md`);
      if (await fs.pathExists(storyPath)) {
          sharedContext += `\n\n--- CURRENT TASK STORY ---\n` + await fs.readFile(storyPath, 'utf8');
      }
  }

  const finalSystemPrompt = metaPromptTemplate
    .replace('{{AGENT_INSTRUCTIONS}}', agentInstructions)
    .replace('{{SHARED_CONTEXT}}', sharedContext);

  let finalUserPrompt = prompt;
  if (agentConfig.archetype === "Executor") {
      finalUserPrompt += await getCodeGraphContext(prompt);
  }

  console.log(chalk.gray(`[LLM Adapter] Getting completion for '${agentId}' using model '${modelToUse}'...`));

  const response = await openai.chat.completions.create({
    model: modelToUse,
    messages: [
      { role: "system", content: finalSystemPrompt },
      { role: "user", content: finalUserPrompt }
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("[LLM Adapter] Failed to parse LLM JSON response:", content);
    throw new Error("LLM returned invalid JSON.");
  }
}

module.exports = { getCompletion };
