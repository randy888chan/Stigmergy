import FirecrawlApp from "@mendable/firecrawl-js";
import { generateObject } from "ai";
import { getModel } from "../ai/providers.js";
import { z } from "zod";
import "dotenv/config.js";
import chalk from "chalk";
import fs from "fs-extra";
import yaml from "js-yaml";
import path from "path";
import axios from "axios";

const ARCHON_API_URL = "http://localhost:8181/api";

let firecrawl;

async function healthCheck() {
  try {
    const response = await axios.get(`${ARCHON_API_URL}/health`, { timeout: 1000 });
    return response.status === 200 && response.data.status === "healthy";
  } catch (error) {
    return false;
  }
}

async function getResearchPrompt() {
  const systemAgentPath = path.join(process.cwd(), ".stigmergy-core", "agents", "system.md");
  const fileContent = await fs.readFile(systemAgentPath, "utf8");
  const yamlMatch = fileContent.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
  if (!yamlMatch) {
    throw new Error("Could not parse YAML from system.md");
  }
  const agentData = yaml.load(yamlMatch[1]);
  const promptTemplate = agentData.research_prompt;

  const now = new Date().toISOString();
  return promptTemplate.replace("{now}", now);
}

function getFirecrawlClient() {
  if (!firecrawl) {
    if (!process.env.FIRECRAWL_KEY) {
      throw new Error("FIRECRAWL_KEY environment variable is not set.");
    }
    firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_KEY });
  }
  return firecrawl;
}

export async function deep_dive({ query, learnings = [] }) {
  const isArchonRunning = await healthCheck();

  if (isArchonRunning) {
    console.log(chalk.green("🚀 Archon server detected. Using advanced RAG for research."));
    try {
      const response = await axios.post(`${ARCHON_API_URL}/rag/query`, { query, match_count: 10 });

      const allContent = response.data.results
        .map((item) => `Source: ${item.url}\n\n${item.markdown || item.content}`)
        .join("\n\n---\n\n");

      const synthesis = await generateObject({
        model: getModel(),
        system: await getResearchPrompt(),
        prompt: `Synthesize the key learnings from the following research content. Extract the most critical insights. Additionally, propose 3-5 new, more specific search queries based on what you've just learned.
    ---
    CONTENT:
    ${allContent}`,
        schema: z.object({
          newLearnings: z
            .array(z.string())
            .describe("A list of key insights and facts discovered."),
          next_research_queries: z
            .array(z.string())
            .describe("A list of new, more focused search queries to continue the research."),
        }),
      });

      const visitedUrls = response.data.results.map((item) => item.url);

      return {
        new_learnings: synthesis.object.newLearnings,
        next_research_queries: synthesis.object.next_research_queries,
        sources: visitedUrls,
      };
    } catch (error) {
      console.error(
        chalk.yellow(`[Research Tool] Archon query failed, falling back to Firecrawl:`),
        error.message
      );
      // Fall through to Firecrawl logic
    }
  }

  // --- Fallback to Firecrawl ---
  console.log(
    chalk.blue("🔧 Archon server not detected or failed. Using native Firecrawl research tool.")
  );
  try {
    const client = getFirecrawlClient();
    const serpGen = await generateObject({
      model: getModel(),
      system: await getResearchPrompt(),
      prompt: `You are a research analyst. Based on the primary research goal and the existing learnings, generate a single, highly effective search query to find the next piece of critical information.
    ---
    PRIMARY GOAL: ${query}
    ---
    EXISTING LEARNINGS:
    ${learnings.join("\n") || "No learnings yet."}
    ---
    What is the next single most important question to answer?`,
      schema: z.object({
        query: z.string().describe("The single best search query to run next."),
      }),
    });

    const searchQuery = serpGen.object.query;
    console.log(`[Research] Executing search: "${searchQuery}"`);

    const searchResults = await client.search(searchQuery, {
      pageOptions: { fetchPageContent: true },
    });

    const allContent = searchResults.data
      .map((item) => `Source: ${item.url}\n\n${item.markdown}`)
      .join("\n\n---\n\n");

    const synthesis = await generateObject({
      model: getModel(),
      system: await getResearchPrompt(),
      prompt: `Synthesize the key learnings from the following research content. Extract the most critical insights. Additionally, propose 3-5 new, more specific search queries based on what you've just learned.
    ---
    CONTENT:
    ${allContent}`,
      schema: z.object({
        newLearnings: z.array(z.string()).describe("A list of key insights and facts discovered."),
        next_research_queries: z
          .array(z.string())
          .describe("A list of new, more focused search queries to continue the research."),
      }),
    });

    const visitedUrls = searchResults.data.map((item) => item.url);

    return {
      new_learnings: synthesis.object.newLearnings,
      next_research_queries: synthesis.object.next_research_queries,
      sources: visitedUrls,
    };
  } catch (error) {
    console.error(
      chalk.red(`[Research Tool] Deep dive failed for query "${query}":`),
      error.message
    );
    return {
      thought: `The research tool failed to execute the deep dive due to an external error: ${error.message}. Returning empty results to allow the system to proceed.`,
      new_learnings: [],
      next_research_queries: [],
      sources: [],
    };
  }
}

/**
 * NEW TOOL: Analyzes a block of text to identify user personas and pain points.
 * @param {object} args
 * @param {string} args.research_data - Text content from market research, user interviews, etc.
 * @returns {Promise<{personas: object[], pain_points: string[]}>}
 */
export async function analyze_user_feedback({ research_data }) {
  console.log("[Research] Analyzing user feedback to extract personas and pain points...");
  const { object } = await generateObject({
    model: getModel(),
    prompt: `You are a UX researcher. From the following research data, identify the primary user personas and their key pain points.
        ---
        RESEARCH DATA:
        ${research_data}`,
    schema: z.object({
      personas: z
        .array(
          z.object({
            name: z
              .string()
              .describe("A descriptive name for the persona, e.g., 'The Busy Professional'"),
            description: z.string().describe("A brief description of this user type."),
            goals: z.array(z.string()).describe("What this persona wants to achieve."),
          })
        )
        .describe("A list of identified user personas."),
      pain_points: z
        .array(z.string())
        .describe("A list of the most significant problems or frustrations mentioned in the data."),
    }),
  });
  return object;
}
