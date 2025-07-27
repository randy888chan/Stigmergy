# Stigmergy: The Autonomous AI Development System

Stigmergy is an autonomous development system that translates your strategic vision into production-ready applications, all from within your IDE. It is designed for a single, powerful handoff where you provide the high-level goal, and the AI swarm handles the detailed planning and execution. The system is stateful and can be stopped and started at any time, automatically resuming from where it left off.

---
## Installation & Setup

Getting started is a simple three-step process.

### Step 1: Install Stigmergy

In your project's root directory, run the installer. This copies the `.stigmergy-core` knowledge base and automatically configures your `.roomodes` file for seamless IDE chat integration.

```bash
npx @randy888chan/stigmergy install
```

### Step 2: Configure Environment

After installation, a `.env.example` file will be in your project root. **Rename it to `.env`** and fill in your credentials. You only need to provide your `LLM_API_KEY` and your Neo4j database URI, user, and password to get started.

```
# .env file
LLM_API_KEY=your_llm_api_key_here
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_database_password
```

### Step 3: Start the Engine

Run `npm run stigmergy:start` to get all necessary packages and run the engine. The engine is a local server that will run quietly in the background, waiting for your commands from the IDE chat.

```bash
npm run stigmergy:start
```
You can stop this process at any time (Ctrl+C). When you start it again, it will automatically resume any in-progress work.

---
## The Stigmergy Workflow: A Conversation with Your AI Team

All interaction with Stigmergy happens through natural language chat in your IDE.

1.  **Launch the Project:** With the engine running, open your IDE's chat window, select the `@system` agent, and provide your project goal.
    ```
    @system start a new project to build a minimalist blog platform on Vercel.
    ```
    The system is now **fully autonomous**. It will automatically perform a one-time indexing of your codebase (if it hasn't already) and then begin the "Grand Blueprint" phase, creating all necessary planning documents and user stories.

2.  **The Single "Go/No-Go" Decision:** Once the entire plan is complete, the system's orchestrator, `@saul`, will pause and notify you in the chat. This is your **one and only approval gate**. Review all generated documents in the `docs/` and `.ai/stories/` directories.

3.  **Final Approval & Autonomous Execution:** To give the final green light, simply give your consent to Saul in natural language.
    ```
    @saul The plan looks solid. You are approved to begin execution.
    ```
    The system will now autonomously execute the entire blueprint without interruption. It will only pause if it requires a secret key (like a deployment API key) that isn't in your `.env` file.

4.  **Pause and Resume at Will:** You can stop the `npm run stigmergy:start` process at any time. The project state is saved. The next time you run `npm run stigmergy:start`, the engine will pick up exactly where it left off, without repeating any steps.
