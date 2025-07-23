# Stigmergy: The Autonomous AI Development System

Stigmergy is an autonomous development system that translates your strategic vision into production-ready applications, all from within your IDE. It is designed for a single, powerful handoff where you provide the high-level goal, and the AI swarm handles the detailed planning and execution.

## The Stigmergy Workflow: Plan, then Execute

The system operates in distinct, uninterruptible phases. All interaction happens via natural language chat in your IDE.

1.  **Start the Engine (Once):** In your IDE's terminal, run the server. It will start in the background and wait for your command.
    ```bash
    npm start
    ```

2.  **Launch the Project:** In your IDE's chat, issue a single command to the system agent with your goal.
    ```
    @system start a new project to build a minimalist blog platform on Vercel.
    ```

3.  **Autonomous "Grand Blueprint" Phase:** The system is now fully autonomous. A crew of planning agents will create a complete project plan, including:
    *   All necessary business and requirements documents (Brief, PRD, Architecture, etc.).
    *   A machine-readable `execution-blueprint.yml`.
    *   Detailed story files for **every task** in the blueprint.
    *   An index of your existing codebase in a Neo4j graph database for context-awareness.

4.  **The Single "Go/No-Go" Decision:** Once the entire plan is complete, the system will pause and notify you. This is your **one and only approval gate**. Review all generated documents in the `docs/` and `.ai/stories/` directories.

5.  **Final Approval & Autonomous Execution:** To give the final green light, simply give your consent in chat.
    ```
    @saul The plan looks solid. You are approved to begin execution.
    ```
    The system will now autonomously execute the entire blueprint without interruption. It will only pause if it requires a secret key (like an API key for deployment).

6.  **Post-Project Self-Improvement:** After the project is complete, the `@metis` agent will automatically audit the project's history and generate an executable blueprint for improving the system's own core files, ensuring Stigmergy learns over time.

---
## Installation & Setup

### Step 1: Install Stigmergy

In your project's root directory, run the following command. This copies the `.stigmergy-core` knowledge base and automatically configures your `.roomodes` file for IDE integration.

```bash
npx @randy888chan/stigmergy install
```
During installation, you will be asked if you want to index your current codebase into Neo4j. This is highly recommended.

### Step 2: Configure Environment

Copy `.env.example` to a new `.env` file. You only need to fill in your `LLM_API_KEY` and Neo4j database credentials to get started. Other keys (like for web search or deployment) can be provided later via the chat interface when an agent asks for them.

### Step 3: Install Dependencies & Start

Run `npm install` to get all necessary packages, then `npm start` to run the engine.

---
## Optional: High-Speed Coding with Gemini CLI UI

Stigmergy includes a specialist `@gemma` agent designed to delegate coding tasks to Google's Gemini CLI tool via the `gemini-cli-ui` backend. This provides extremely fast, cost-effective code generation and allows for real-time interactive oversight.

**To use this feature:**
1.  Ensure you have `gemini-cli` installed and the `gemini-cli-ui` server running separately.
2.  When the `@dispatcher` (Saul) is making its decisions, it will automatically prefer using `@gemma` for coding tasks, leveraging the speed of the local tool. You can watch the progress in real-time in the Gemini CLI UI.

## Project Maintenance

After a project is complete, you can ask the system's janitor agent to scan for technical debt.

```bash
npm run stigmergy:cleanup
```
This will guide you on how to invoke the `@refactorer` (Rocco) agent to find and propose removal of dead code and unused dependencies.
