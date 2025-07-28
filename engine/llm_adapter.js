const OpenAI = require("openai");
const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const contextEnhancer = require("./context_enhancer"); // <-- The enhancer is now used here
const { getModel } = require("../ai/providers"); // <-- Use our flexible provider
require("dotenv").config();
// This will now be initialized dynamically by getModel()
let llm;
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
// In-memory cache for static files to reduce disk I/O
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
'.stigmergy-core/system_docs/00_System_Goal.md',
'.stigmergy-core/system_docs/01_System_Architecture.md',
'.stigmergy-core/system_docs/03_Core_Principles.md',
'.stigmergy-core/system_docs/04_System_State_Schema.md',
'docs/brief.md',
'docs/prd.md',
'docs/architecture.md',
'docs/architecture/tech-stack.md',
'docs/architecture/coding-standards.md',
];
let context = "";
for (const docPath of docs) {
const fullPath = path.join(process.cwd(), docPath);
const content = await getCachedFile(fullPath);
if (content) {
context += --- START ${docPath} ---\n${content}\n--- END ${docPath} ---\n\n;
}
}
return context;
}
async function getCompletion(agentId, prompt, taskId) {
if (!llm) {
llm = getModel(); // Initialize the model on first use
}
const agentPath = path.join(__dirname, "..", ".stigmergy-core", "agents", ${agentId}.md);
const agentInstructions = await getCachedFile(agentPath);
const metaPromptTemplate = await getCachedFile(META_PROMPT_PATH);
let sharedContext = await getSharedContext();
// Add current state.json to context
const statePath = path.join(process.cwd(), ".ai", "state.json");
const stateContent = await getCachedFile(statePath);
if (stateContent) {
sharedContext += --- START CURRENT STATE: .ai/state.json ---\n${stateContent}\n--- END CURRENT STATE ---\n\n;
}
let taskContent = "";
if (taskId) {
const storyPath = path.join(process.cwd(), ".ai", "stories", ${taskId}.md);
if (await fs.pathExists(storyPath)) {
taskContent = await fs.readFile(storyPath, "utf8");
sharedContext += \n\n--- CURRENT TASK: ${taskId}.md ---\n + taskContent;
}
}
// --- *** THE CRITICAL RAG INTEGRATION *** ---
// If there's a task, use its content to enhance the context from the code graph.
if (taskContent) {
const dynamicContext = await contextEnhancer.enhance(taskContent);
sharedContext += "\n\n" + dynamicContext;
}
// --- *** END RAG INTEGRATION *** ---
const finalSystemPrompt = metaPromptTemplate.replace("{{AGENT_INSTRUCTIONS}}", agentInstructions)
.replace("{{SHARED_CONTEXT}}", sharedContext);
const response = await llm.generate({
prompt: ${finalSystemPrompt}\n\nUser query: ${prompt},
// In a real implementation, you would construct a proper message history here
});
// This part needs to be adapted based on the exact response structure of the AI SDK
// For now, we assume a simple text response that is valid JSON.
try {
// Assuming the AI SDK's response has a text property with the generated content
const rawJSON = response.text || response.choices[0].message.content;
return JSON.parse(rawJSON);
} catch (e) {
console.error("Failed to parse LLM response as JSON:", response.text);
return { thought: "Error: My response was not valid JSON.", action: null };
}
}
module.exports = {
getCompletion,
};
