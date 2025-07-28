#Stigmergy: The Autonomous AI Product Team in Your IDE</h1>

An AI-powered system that translates high-level product goals into market research, visual designs, technical plans, and production-ready code, all orchestrated from within your development environment.

Stigmergy is an autonomous development system that operates as your AI-powered product team. It takes a single, high-level goal and orchestrates a swarm of specialized AI agents to handle the entire development lifecycle: from market research and competitor analysis to UI/UX design, architectural planning, and final code implementation.

The system is architected to be **headless and IDE-native**. The Stigmergy engine runs as a local MCP (Model-Context Protocol) server, acting as the "brain" that your IDE tools (like Roo Code or the SuperDesign extension) communicate with. It is stateful, resumable, and designed for a single, powerful handoff where you provide the vision and the AI team handles the execution.

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
        J -- Writes Files --> G;
    end

    style C fill:#82589F,stroke:#6D214F,color:white
    style E fill:#3B3B98,stroke:#1B1464,color:white
    style F fill:#FD7272,stroke:#D63031,color:white
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

---

## Contributing

This repository is a foundational engine. Contributions are welcome to expand its capabilities. The key areas for development are:
*   **`services/code_intelligence_service.js`**: Enhancing the code parser to support more languages and extract richer semantic information.
*   **`tools/code_intelligence.js`**: Adding more sophisticated Cypher queries to expose deeper insights to agents (e.g., semantic search, quality metrics).
*   **`.stigmergy-core/agents/`**: Creating new, specialized agents for different domains (e.g., DevOps, data science, security).

---

## License

This project is licensed under the MIT License.
