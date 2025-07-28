import fs from "fs-extra";
import path from "path";
import { enhance as enhanceContext } from "./context_enhancer.js";
import { getModel } from "../ai/providers.js";
import "dotenv/config.js";

let llm;

const META_PROMPT_PATH = path.join(
  process.cwd(),
  ".stigmergy-core",
  "utils",
  "meta_prompt_template.md"
);

const fileCache = new Map();

async function getCachedFile(filePath) {
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

async function getSharedContext() {
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

export async function getCompletion(agentId, prompt, taskId) {
  if (!llm) {
    llm = getModel();
  }

  const agentPath = path.join(process.cwd(), ".stigmergy-core", "agents", `${agentId}.md`);
  const agentInstructions = await getCachedFile(agentPath);
  const metaPromptTemplate = await getCachedFile(META_PROMPT_PATH);

  let sharedContext = await getSharedContext();

  const statePath = path.join(process.cwd(), ".ai", "state.json");
  const stateContent = await getCachedFile(statePath);
  if (stateContent) {
    sharedContext += `--- START CURRENT STATE: .ai/state.json ---\n${stateContent}\n--- END CURRENT STATE ---\n\n`;
  }

  let taskContent = "";
  if (taskId) {
    const storyPath = path.join(process.cwd(), ".ai", "stories", `${taskId}.md`);
    if (await fs.pathExists(storyPath)) {
      taskContent = await fs.readFile(storyPath, "utf8");
      sharedContext += `\n\n--- CURRENT TASK: ${taskId}.md ---\n` + taskContent;
    }
  }

  if (taskContent) {
    const dynamicContext = await enhanceContext(taskContent);
    sharedContext += "\n\n" + dynamicContext;
  }

  const finalSystemPrompt = metaPromptTemplate
    .replace("{{AGENT_INSTRUCTIONS}}", agentInstructions)
    .replace("{{SHARED_CONTEXT}}", sharedContext);

  const finalPrompt = `${finalSystemPrompt}\n\nUser query: ${prompt}`;

  try {
    const result = await llm.generate({ prompt: finalPrompt });

    let rawJSON = result.text;
    if (!rawJSON && result.choices && result.choices.length > 0) {
      rawJSON = result.choices[0].message.content;
    }

    if (!rawJSON) {
      console.error("LLM response did not contain expected text or content field:", result);
      return { thought: "Error: Received an empty response from the LLM.", action: null };
    }

    return JSON.parse(rawJSON);
  } catch (e) {
    console.error("Failed to parse LLM response as JSON. Raw response:", e.body);
    return { thought: "Error: My response was not valid JSON.", action: null };
  }
}
