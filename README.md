Of course. I have reviewed the in-depth analysis and will now provide the precise file modifications to implement the excellent recommendations for improving Stigmergy's resilience and scalability.

Here are the complete changes for each recommended improvement.

### **ACTION 1: MODIFY - Enhance Dispatcher Logging for Auditability**

To improve the transparency of the AI-driven orchestration, I will add prominent logging for the `@dispatcher` agent's reasoning. This creates a clear audit trail for debugging and monitoring the system's decision-making process.

**File:** `engine/server.js`

```javascript
import express from "express";
import chalk from "chalk";
import { Server as McpServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as stateManager from "./state_manager.js";
import { getCompletion } from "./llm_adapter.js";
import { execute as executeTool } from "./tool_executor.js";
import codeIntelligenceService from "../services/code_intelligence_service.js";
import "dotenv/config.js";
import { fileURLToPath } from "url";
import path from "path";

export class Engine {
  constructor() {
    this.isEngineRunning = false;
    this.engineLoopHandle = null;
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.post("/api/system/start", async (req, res) => {
      const { goal } = req.body;
      if (!goal) return res.status(400).json({ error: "'goal' is required." });
      await stateManager.initializeProject(goal);

      try {
        console.log("[Engine] Triggering initial code indexing...");
        await codeIntelligenceService.scanAndIndexProject(process.cwd());
        console.log("[Engine] Code indexing complete.");
      } catch (error) {
        console.warn(
          chalk.yellow(
            "[Engine] Automatic code indexing failed. Code-aware features will be limited. Please check Neo4j connection and credentials."
          ),
          error.message
        );
      }

      this.start();
      res.json({ message: "Project initiated." });
    });
    this.app.post("/api/control/pause", async (req, res) => {
      await this.stop("Paused by user");
      await stateManager.pauseProject();
      res.json({ message: "Engine has been paused." });
    });
    this.app.post("/api/control/resume", async (req, res) => {
      await stateManager.resumeProject();
      this.start();
      res.json({ message: "Engine has been resumed." });
    });
  }

  async triggerAgent(agentId, prompt, taskId = null) {
    const response = await getCompletion(agentId, prompt, taskId);

    // --- RECOMMENDED IMPROVEMENT: Log dispatcher thoughts for auditability ---
    if (agentId === "dispatcher") {
      console.log(chalk.magenta.bold(`[Dispatcher Thought] 🧠: ${response.thought}`));
    }
    // --------------------------------------------------------------------

    if (response.action?.tool) {
      return executeTool(response.action.tool, response.action.args, agentId);
    }
    return response.thought;
  }

  async dispatchAgentForState(state) {
    const status = state.project_status;
    console.log(chalk.yellow(`[Engine] Current project status: ${status}`));

    const autonomous_states = [
      "GRAND_BLUEPRINT_PHASE",
      "EXECUTION_IN_PROGRESS",
      "EXECUTION_FAILED",
    ];

    if (autonomous_states.includes(status)) {
      console.log(chalk.blue("[Engine] Dispatching @dispatcher to determine next action."));
      const stateJson = JSON.stringify(state, null, 2);
      const prompt = `System state has been updated. Analyze the current state and determine the next single, most logical action for the swarm.\n\nCURRENT STATE:\n${stateJson}`;
      return this.triggerAgent("dispatcher", prompt);
    } else {
      console.log(
        chalk.gray(
          `[Engine] No autonomous action required for status: ${status}. Waiting for user interaction or state change.`
        )
      );
    }
  }

  async runLoop() {
    if (!this.isEngineRunning) return;
    try {
      const state = await stateManager.getState();
      await this.dispatchAgentForState(state);
    } catch (error) {
      console.error(chalk.red("[Engine] Error in loop:"), error);
      await this.stop("Error");
    }
    if (this.isEngineRunning) {
      this.engineLoopHandle = setTimeout(() => this.runLoop(), 5000);
    }
  }

  start() {
    if (this.isEngineRunning) return;
    this.isEngineRunning = true;
    console.log(chalk.bold.green("\n--- Stigmergy Engine Engaged ---\n"));
    this.runLoop();
  }

  async stop(reason) {
    if (!this.isEngineRunning) return;
    this.isEngineRunning = false;
    if (this.engineLoopHandle) clearTimeout(this.engineLoopHandle);
    console.log(chalk.bold.red(`\n--- Stigmergy Engine Disengaged (Reason: ${reason}) ---\n`));
  }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

async function main() {
  // --- FIX: Instantiate the engine HERE, inside the main execution block ---
  const engine = new Engine();

  const mcpServer = new McpServer({ name: "stigmergy-engine", version: "2.1.0" });
  await mcpServer.connect(new StdioServerTransport());
  console.log(chalk.bold("[MCP Server] Running in STDIO mode."));

  const PORT = process.env.PORT || 3000;

  engine.app.listen(PORT, async () => {
    console.log(chalk.bold(`[Server] Status API listening on http://localhost:${PORT}`));
    const state = await stateManager.getState();
    if (["GRAND_BLUEPRINT_PHASE", "EXECUTION_IN_PROGRESS"].includes(state.project_status)) {
      engine.start();
    }
  });
}

// Only run main when this file is executed directly
if (isMainModule) {
  main().catch(console.error);
}
```

### **ACTION 2: MODIFY - Implement Universal Tool Resilience**

To prevent the entire system from halting due to a single tool's external network failure, I will apply the recommended resilient error-handling pattern to the `research.deep_dive` tool. This ensures it gracefully handles failures and returns a valid, empty response.

**File:** `tools/research.js`

```javascript
import FirecrawlApp from "@mendable/firecrawl-js";
import { generateObject } from "ai";
import { getModel, systemPrompt } from "../ai/providers.js";
import { z } from "zod";
import "dotenv/config.js";
import chalk from "chalk"; // <-- ADD THIS IMPORT

let firecrawl;
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
  // --- RECOMMENDED IMPROVEMENT: Add try...catch for resilience ---
  try {
    const client = getFirecrawlClient();
    const serpGen = await generateObject({
      model: getModel(),
      system: systemPrompt(),
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
      .map(item => `Source: ${item.url}\n\n${item.markdown}`)
      .join("\n\n---\n\n");

    const synthesis = await generateObject({
      model: getModel(),
      system: systemPrompt(),
      prompt: `Synthesize the key learnings from the following research content. Extract the most critical insights. Additionally, propose 3-5 new, more specific search queries based on what you've just learned.
    ---
    CONTENT:
    ${allContent}`,
      schema: z.object({
        newLearnings: z.array(z.string()).describe("A list of key insights and facts discovered."),
        next_research_queries: z.array(z.string()).describe("A list of new, more focused search queries to continue the research."),
      }),
    });

    const visitedUrls = searchResults.data.map(item => item.url);

    return {
      new_learnings: synthesis.object.newLearnings,
      next_research_queries: synthesis.object.next_research_queries,
      sources: visitedUrls,
    };
  } catch (error) {
    console.error(chalk.red(`[Research Tool] Deep dive failed for query "${query}":`), error.message);
    return {
      thought: `The research tool failed to execute the deep dive due to an external error: ${error.message}. Returning empty results to allow the system to proceed.`,
      new_learnings: [],
      next_research_queries: [],
      sources: [],
    };
  }
  // --------------------------------------------------------------------
}
```

### **ACTION 3: MODIFY - Document the Scalability Roadmap**

The recommendation for an incremental indexing strategy is a significant architectural enhancement best suited for future development. I will add this to the `README.md` to create a public-facing roadmap and guide future contributions.

**File:** `README.md`

```markdown
# Stigmergy: The Autonomous AI Product Team in Your IDE

An AI-powered system that translates high-level product goals into market research, visual designs, technical plans, and production-ready code, all orchestrated from within your development environment.

Stigmergy is an autonomous development system that operates as your AI-powered product team. It takes a single, high-level goal and orchestrates a swarm of specialized AI agents to handle the entire development lifecycle: from market research and competitor analysis to UI/UX design, architectural planning, and final code implementation.

The system is architected to be **headless and IDE-native**. The Stigmergy engine runs as a local MCP (Model-Context Protocol) server, acting as the "brain" that your IDE tools (like Roo Code or the SuperDesign extension) communicate with. It is stateful, resumable, and designed for a single, powerful handoff where you provide the vision and the AI team handles the execution.

### **New: Business Strategy Capabilities**

Stigmergy now includes a suite of agents focused on business planning and strategy:
*   **Business Plan Generation:** A dedicated `@brian` agent can generate a comprehensive business plan, complete with financial projections.
*   **Business Valuation:** The `@val` agent can perform a data-driven valuation of the business using standard financial models.
*   **Crypto Whitepaper Authoring:** For web3 projects, the `@whitney` agent can author a detailed technical and tokenomics whitepaper.

### The New Stigmergy Architecture

The refactored system is a powerful, modular ecosystem that separates concerns for maximum performance and extensibility.

```mermaid
graph TD
    subgraph "User's IDE (VS Code / Roo Code)"
        A[User provides goal: "Build a minimalist blog"] --> B{IDE Extension (e.g., Roo Code)};
        B -- MCP Tool Call --> C{Stigmergy Engine (MCP Server)};
        F[SuperDesign Canvas] -- Renders Files --> G[File System: .superdesign/];
    end

    subgraph "Stigmergy Engine (The Brain)"
        C --> D[Agent Orchestrator & State Machine];
        D <--> E[Code Intelligence Service (Neo4j Graph)];
    end

    subgraph "Specialized Tools (The Senses & Hands)"
        D -- Executes Tools --> H[Research Tool (Firecrawl)];
        D -- Executes Tools --> I[Code Generation (Gemini CLI)];
        D -- Executes Tools --> J[File System Tools];
        D -- Executes Tools --> K[Business Tools (Financial Modeling)];
        J -- Writes Files --> G;
    end

    style C fill:#82589F,stroke:#6D214F,color:white
    style E fill:#3B3B98,stroke:#1B1464,color:white
    style F fill:#FD7272,stroke:#D63031,color:white
    style K fill:#2ecc71,stroke:#27ae60,color:white
```

### Core Pillars

*   **🧠 True Autonomy:** The engine is a real, state-driven orchestrator. It autonomously sequences agents for planning, design, and execution based on project state, not a simulation.
*   **📈 Deep Research & Strategy:** Planning agents are supercharged with an iterative deep research tool. They perform market and competitor analysis to create high-quality, evidence-based product documents, not just placeholder content.
*   **🎨 Visual Design Integration:** A dedicated design agent (`@vinci`) generates multiple UI/UX mockups as HTML/SVG files, which can be visualized and iterated upon in a companion VS Code extension like **SuperDesign**.
*   **🕸️ Graph-Based Code Intelligence:** The system builds a rich knowledge graph of your codebase in Neo4j (inspired by `jonnoc-coderag`). This gives execution agents a deep, real-time understanding of your existing code, dramatically improving the quality and context-awareness of generated code.

---

### The Autonomous Workflow: From Idea to Implementation

All interaction with Stigmergy happens through your IDE's AI chat interface, which acts as a client to the Stigmergy MCP server.

1.  **Project Kickoff:** With the engine running, you provide your project goal to the system agent in your IDE.
    ```
    @system start a new project to build a minimalist blog platform on Vercel.
    ```

2.  **Autonomous Strategy & Research Phase:** The system is now **fully autonomous**.
    *   The `@analyst` agent is dispatched. It uses the **Firecrawl-powered research tool** to perform a deep dive into the market, saving `market-research.md` and `competitor-analysis.md` to your `docs/` folder.
    *   It then generates a comprehensive `brief.md` based on its findings.
    *   The engine's state updates, and the `@pm` agent is dispatched to create a detailed `prd.md`.

3.  **Autonomous Design Phase:**
    *   The `@design` agent runs. It researches modern UI patterns and generates three distinct HTML/SVG mockup variations for the core UI.
    *   It saves these files to the `.superdesign/design_iterations/` directory. If you are using the SuperDesign extension, its canvas will automatically update to display these visual options.

4.  **The Single "Go/No-Go" Decision:** Once the entire plan and design are complete, the system's orchestrator notifies you in the chat. This is your **one and only approval gate**. Review all generated documents in `docs/` and the visual mockups.

5.  **Final Approval & Autonomous Execution:** To give the final green light, you send an approval message.
    ```
    @saul The plan and design look solid. You are approved to begin execution.
    ```
    The system now autonomously executes the entire blueprint. The `@dev` and `@gemini-executor` agents use the **Code Intelligence Service** to pull real-time context about the codebase as they write and modify files, ensuring high-quality, context-aware output.

6.  **Pause and Resume at Will:** You can stop the `npm run stigmergy:start` process at any time. The project state is saved. The next time you run it, the engine will pick up exactly where it left off.

---

## Installation & Setup

Getting started is a simple four-step process.

### Step 1: Install Prerequisites

Stigmergy's code intelligence service requires a running **Neo4j** database.
*   **Install Neo4j Desktop:** Download and install from the official [Neo4j website](https://neo4j.com/download/).
*   **Create and start a database.** Note the password you set.

### Step 2: Install Stigmergy

In your project's root directory, run the installer. This copies the `.stigmergy-core` knowledge base and automatically configures your `.roomodes` file for seamless IDE chat integration.

```bash
npx @randy888chan/stigmergy install
```

### Step 3: Configure Your Environment

After installation, a `.env.example` file will be in your project root. **Rename it to `.env`** and fill in your credentials.

```
# .env file

# -- AI Provider Configuration --
# OpenRouter is recommended for flexibility. Get a key at https://openrouter.ai/
OPENROUTER_API_KEY=your_openrouter_key
LITELLM_MODEL_ID=google/gemini-pro-1.5 # You can change this to any model on OpenRouter

# -- Research Tool Configuration --
# Get a free key at https://firecrawl.dev
FIRECRAWL_KEY=your_firecrawl_key

# -- Neo4j Database Configuration --
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_database_password
```

### Step 4: Start the Engine

Run `npm run stigmergy:start` to install all necessary packages and run the engine. The engine is a local MCP server that will run in the background, waiting for commands from your IDE.

```bash
npm run stigmergy:start
```

You are now ready to control the Stigmergy engine from your IDE's chat interface.

### Web Agent Prompt Bundler

The `builder/` directory contains tools (`npm run build`) to compile the agent definitions from `.stigmergy-core/` into a single, self-contained text file. This is designed for use cases where the Stigmergy agent knowledge base needs to be run in a browser-based environment (e.g., for cost-effective initial planning in a web UI like Gemini) or a different backend that doesn't use the core engine. This allows for a flexible workflow where high-level planning can be done in a web UI before moving to the IDE for execution.
---

## Contributing & Future Enhancements

This repository is a foundational engine. Contributions are welcome to expand its capabilities. The key areas for development are:

*   **`services/code_intelligence_service.js`**: Enhancing the code parser to support more languages and extract richer semantic information.
*   **`tools/code_intelligence.js`**: Adding more sophisticated Cypher queries to expose deeper insights to agents (e.g., semantic search, quality metrics).
*   **`.stigmergy-core/agents/`**: Creating new, specialized agents for different domains (e.g., DevOps, data science, security).

### **Roadmap: Scalability and Performance**
*   **Incremental Code Indexing:** A key future enhancement is to move from a full re-index to an incremental one. This would involve implementing a file watcher to detect changes in the codebase and only update the affected nodes and relationships in the Neo4j graph. This will significantly improve performance and scalability for very large, enterprise-scale projects.

---

## License

This project is licensed under the MIT License.
```

These modifications directly address the recommendations from your analysis, enhancing the system's observability and resilience while establishing a clear roadmap for future scalability improvements.
