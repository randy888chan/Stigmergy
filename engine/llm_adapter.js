const OpenAI = require("openai");
const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const contextEnhancer = require("./context_enhancer"); // <-- NEW: Import the enhancer

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

  let taskContent = "";
  if (taskId) {
    const storyPath = path.join(process.cwd(), ".ai", "stories", `${taskId}.md`);
    if (await fs.pathExists(storyPath)) {
      taskContent = await fs.readFile(storyPath, "utf8");
      sharedContext += `\n\n--- CURRENT TASK STORY ---\n` + taskContent;
    }
  }

  // --- NEW: RAG IMPLEMENTATION ---
  // If there's a task, use it to enhance the context from the code graph.
  if (taskContent) {
    const dynamicContext = await contextEnhancer.enhance(taskContent);
    sharedContext += "\n\n" + dynamicContext;
  }
  // --- END NEW ---

  // ... (rest of the function is the same)
}

// ... (export the functions)
