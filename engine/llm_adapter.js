const OpenAI = require("openai");
const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const codeGraph = require("../tools/code_graph");

require("dotenv").config();

const openai = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
});

const META_PROMPT_PATH = path.join(
  __dirname,
  "..",
  ".stigmergy-core",
  "utils",
  "meta_prompt_template.md"
);
const MANIFEST_PATH = path.join(
  __dirname,
  "..",
  ".stigmergy-core",
  "system_docs",
  "02_Agent_Manifest.md"
);
const SHARED_CONTEXT_PATH = path.join(process.cwd(), ".ai", "project_context.md");

// ... (getCodeGraphContext and getAgentManifest functions remain the same) ...

async function getCompletion(agentId, prompt, taskId) {
  const agentPath = path.join(__dirname, "..", ".stigmergy-core", "agents", `${agentId}.md`);
  // ... (rest of the function)

  if (taskId) {
    const storyPath = path.join(process.cwd(), ".ai", "stories", `${taskId}.md`);
    if (await fs.pathExists(storyPath)) {
      sharedContext += `\n\n--- CURRENT TASK STORY ---\n` + (await fs.readFile(storyPath, "utf8"));
    }
  }

  // ... (rest of the function is the same)
}

// ... (export the functions)
