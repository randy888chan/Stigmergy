const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const codeGraph = require('../tools/code_graph');

require('dotenv').config();

const openai = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
});

// MODIFICATION: Use the central configuration file
const config = require(path.resolve(process.cwd(), 'stigmergy.config.js'));
const META_PROMPT_PATH = path.join(__dirname, '..', config.corePath, 'utils', 'meta_prompt_template.md');
const MANIFEST_PATH = path.join(__dirname, '..', config.corePath, 'system_docs', '02_Agent_Manifest.md');
const SHARED_CONTEXT_PATH = path.join(process.cwd(), config.aiArtifacts, 'project_context.md');


let agentManifest = null;
async function getAgentManifest() {
    if (!agentManifest) {
        const manifestContent = await fs.readFile(MANIFEST_PATH, 'utf-8');
        agentManifest = yaml.load(manifestContent);
    }
    return agentManifest;
}

// ... (getCodeGraphContext function remains the same)

async function getCompletion(agentId, prompt, taskId) {
  const agentPath = path.join(__dirname, '..', config.corePath, 'agents', `${agentId}.md`);
  if (!await fs.pathExists(agentPath)) throw new Error(`Agent file not found: ${agentId}`);

  const manifest = await getAgentManifest();
  const agentConfig = manifest.agents.find(a => a.id === agentId);
  if (!agentConfig) throw new Error(`Agent config not found for ${agentId}`);

  const modelToUse = agentConfig.model_preference || 'gpt-4-turbo';
  const agentInstructions = await fs.readFile(agentPath, 'utf-8');
  const metaPromptTemplate = await fs.readFile(META_PROMPT_PATH, 'utf-8');
  
  let sharedContext = "";
  if (await fs.pathExists(SHARED_CONTEXT_PATH)) {
      sharedContext += await fs.readFile(SHARED_CONTEXT_PATH, 'utf8');
  }
  if (taskId) {
      // MODIFICATION: Use the central configuration file path
      const storyPath = path.join(process.cwd(), config.storiesPath, `${taskId}.md`);
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
    throw new Error("LLM returned invalid JSON.");
  }
}

module.exports = { getCompletion, getCodeGraphContext };
