# Stigmergy: The Autonomous AI Product Team in Your IDE

An AI-powered system that translates high-level product goals into market research, visual designs, technical plans, and production-ready code, all orchestrated from within your development environment.

Stigmergy is an autonomous development system that operates as your AI-powered product team. It takes a single, high-level goal and orchestrates a swarm of specialized AI agents to handle the entire development lifecycle: from market research and competitor analysis to UI/UX design, architectural planning, and final code implementation.

The system is architected to be **headless and IDE-native**. The Stigmergy engine runs as a local MCP (Model-Context Protocol) server, acting as the "brain" that your IDE tools (like Roo Code or the SuperDesign extension) communicate with. It is stateful, resumable, and designed for a single, powerful handoff where you provide the vision and the AI team handles the execution.

### **New: Business Strategy Capabilities**

Stigmergy now includes a suite of agents focused on business planning and strategy:

- **Business Plan Generation:** A dedicated `@brian` agent can generate a comprehensive business plan, complete with financial projections.
- **Business Valuation:** The `@val` agent can perform a data-driven valuation of the business using standard financial models.
- **Crypto Whitepaper Authoring:** For web3 projects, the `@whitney` agent can author a detailed technical and tokenomics whitepaper.

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

- **🧠 True Autonomy:** The engine is a real, state-driven orchestrator. It autonomously sequences agents for planning, design, and execution based on project state, not a simulation.
- **📈 Deep Research & Strategy:** Planning agents are supercharged with an iterative deep research tool. They perform market and competitor analysis to create high-quality, evidence-based product documents, not just placeholder content.
- **🎨 Visual Design Integration:** A dedicated design agent (`@vinci`) generates multiple UI/UX mockups as HTML/SVG files, which can be visualized and iterated upon in a companion VS Code extension like **SuperDesign**.
- **🕸️ Graph-Based Code Intelligence:** The system builds a rich knowledge graph of your codebase in Neo4j (inspired by `jonnoc-coderag`). This gives execution agents a deep, real-time understanding of your existing code, dramatically improving the quality and context-awareness of generated code.

---

### The Autonomous Workflow: From Idea to Implementation

All interaction with Stigmergy happens through your IDE's AI chat interface, which acts as a client to the Stigmergy MCP server.

1.  **Project Kickoff:** With the engine running, you provide your project goal to the system agent in your IDE.

    ```
    @system start a new project to build a minimalist blog platform on Vercel.
    ```

2.  **Autonomous Strategy & Research Phase:** The system is now **fully autonomous**.
    - The `@analyst` agent is dispatched. It uses the **Firecrawl-powered research tool** to perform a deep dive into the market, saving `market-research.md` and `competitor-analysis.md` to your `docs/` folder.
    - It then generates a comprehensive `brief.md` based on its findings.
    - The engine's state updates, and the `@pm` agent is dispatched to create a detailed `prd.md`.

3.  **Autonomous Design Phase:**
    - The `@design` agent runs. It researches modern UI patterns and generates three distinct HTML/SVG mockup variations for the core UI.
    - It saves these files to the `.superdesign/design_iterations/` directory. If you are using the SuperDesign extension, its canvas will automatically update to display these visual options.

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

- **Install Neo4j Desktop:** Download and install from the official [Neo4j website](https://neo4j.com/download/).
- **Create and start a database.** Note the password you set.

### Step 2: Install Stigmergy

In your project's root directory, run the installer. This copies the `.stigmergy-core` knowledge base and automatically configures your `.roomodes` file for seamless IDE chat integration.

```bash
npx @randy888chan/stigmergy install
```

### Step 3: Configure Your Environment

After installation, a `.env.example` file will be in your project root. **Rename it to `.env`** and fill in your credentials. The system has a flexible AI provider that prioritizes keys in the following order:

1.  **Custom OpenAI-Compatible Endpoint** (e.g., local LLM via LM Studio)
2.  **OpenRouter** (Recommended for access to many models)
3.  **Direct OpenAI**

Fill in the variables for the provider you wish to use.

```
# .env file

# --- OPTION 1: Custom OpenAI-Compatible Endpoint (HIGHEST PRIORITY) ---
# Example for a local LLM server via LM Studio or Ollama
# OPENAI_ENDPOINT="http://localhost:11434/v1"
# CUSTOM_MODEL="llama3" # The model name your local server is serving

# --- OPTION 2: OpenRouter (RECOMMENDED) ---
# OPENROUTER_API_KEY=your_openrouter_key
# LITELLM_MODEL_ID=google/gemini-pro-1.5 # You can change this to any model on OpenRouter

# --- OPTION 3: Direct OpenAI (FALLBACK) ---
# OPENAI_KEY=your_openai_key

# --- Research Tool Configuration ---
# Get a free key at https://firecrawl.dev
FIRECRAWL_KEY=your_firecrawl_key

# --- Neo4j Database Configuration ---
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

## System Features & Roadmap

### Web Agent Prompt Bundler

The `builder/` directory contains tools (`npm run build`) to compile the agent definitions from `.stigmergy-core/` into a single, self-contained text file. This is designed for use cases where the Stigmergy agent knowledge base needs to be run in a browser-based environment (e.g., for cost-effective initial planning in a web UI like Gemini) or a different backend that doesn't use the core engine. This allows for a flexible workflow where high-level planning can be done in a web UI before moving to the IDE for execution.

### Contributing

This repository is a foundational engine. Contributions are welcome to expand its capabilities. The key areas for development are:

- **`services/code_intelligence_service.js`**: Enhancing the code parser to support more languages and extract richer semantic information.
- **`tools/code_intelligence.js`**: Adding more sophisticated Cypher queries to expose deeper insights to agents (e.g., semantic search, quality metrics).
- **`.stigmergy-core/agents/`**: Creating new, specialized agents for different domains (e.g., DevOps, data science, security).

### Future Enhancements

- **Incremental Code Indexing:** A key future enhancement is to move from a full re-index to an incremental one. This would involve implementing a file watcher to detect changes in the codebase and only update the affected nodes and relationships in the Neo4j graph. This will significantly improve performance and scalability for very large, enterprise-scale projects.

---

## Learn More

To get the most out of Stigmergy, explore the detailed documentation and examples:

- **[📄 How to Create Custom Agents](./docs/custom_agents_guide.md)**: A step-by-step guide to creating your own specialized agents to extend the system's capabilities.
- **[🚀 Advanced Features and Tools](./docs/advanced_features.md)**: Learn how to use powerful tools like `research.deep_dive` and `code_intelligence.findUsages`.

### Example Use Cases

Explore these real-world examples to see how Stigmergy can be applied to different types of projects:

- **[SaaS Application](./examples/saas_app/README.md)**: See how Stigmergy can build a complete SaaS platform from a high-level goal.
- **[Refactoring Legacy Code](./examples/refactoring_legacy_code/README.md)**: Learn how Stigmergy uses its code intelligence features to safely refactor an old codebase.
- **[Workflow Modification](./examples/workflow_modification/)**: Examples of how to customize agent teams for specific project needs, like web development or data processing.

---

## License

This project is licensed under the MIT License.

---

## Lightweight vs. Power Mode

Stigmergy is designed to be flexible and adapt to your needs. It can run in two modes:

### Lightweight Mode (Default)

By default, Stigmergy runs in a lightweight, JavaScript-only mode. It uses its built-in research and analysis tools, which are powerful for a wide range of tasks and require no additional setup.

### Power Mode (with Archon)

For significantly superior research, knowledge management, and long-term memory, you can enable **Power Mode** by connecting Stigmergy to an **Archon** knowledge engine instance. Archon provides a dedicated, persistent knowledge base with advanced RAG (Retrieval-Augmented Generation) capabilities.

When Archon is running, Stigmergy will **automatically detect it** and route all research-intensive tasks through it, giving your agents a much deeper and more reliable source of information.

**To enable Power Mode:**

1.  **Install Docker:** Ensure Docker and Docker Compose are installed on your system.
2.  **Clone the Archon Repository:**
    ```bash
    git clone https://github.com/coleam00/archon.git
    ```
3.  **Set up and Run Archon:** Follow the instructions in the Archon `README.md` to set up its `.env` file and launch the services.
    ```bash
    cd archon
    docker-compose up -d
    ```
4.  **Start Stigmergy:** Start Stigmergy as you normally would. It will automatically detect and connect to the Archon server.
