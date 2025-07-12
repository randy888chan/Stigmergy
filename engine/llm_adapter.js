const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
});

async function getCompletion(agentId, prompt) {
  const agentPath = path.join(__dirname, '..', '.stigmergy-core', 'agents', `${agentId}.md`);
  const agentInstructions = await fs.readFile(agentPath, 'utf-8');

  console.log(`[LLM Adapter] Getting completion for ${agentId}...`);

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo", // Or your preferred model
    messages: [
      { role: "system", content: agentInstructions },
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
