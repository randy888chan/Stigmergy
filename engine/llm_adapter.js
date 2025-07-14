const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
});

const META_PROMPT_PATH = path.join(__dirname, '..', '.stigmergy-core', 'utils', 'meta_prompt_template.md');

async function getCompletion(agentId, prompt) {
  const agentPath = path.join(__dirname, '..', '.stigmergy-core', 'agents', `${agentId}.md`);
  if (!await fs.pathExists(agentPath)) {
      throw new Error(`Agent file not found for agentId: ${agentId}`);
  }

  const agentInstructions = await fs.readFile(agentPath, 'utf-8');
  const metaPromptTemplate = await fs.readFile(META_PROMPT_PATH, 'utf-8');
  
  // Combine meta-prompt with agent-specific instructions
  const finalSystemPrompt = metaPromptTemplate.replace('{{AGENT_INSTRUCTIONS}}', agentInstructions);

  console.log(`[LLM Adapter] Getting completion for ${agentId}...`);

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo", // This can be made dynamic based on agent manifest
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
    // Fallback if the LLM fails to produce valid JSON
    return { thought: "The model did not return valid JSON. The raw response was: " + content, action: null };
  }
}

module.exports = { getCompletion };
