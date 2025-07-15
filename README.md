# Pheromind: The Autonomous AI Development System

Pheromind is an autonomous development system that translates your strategic vision into production-ready applications. It operates as a local AI engine, powering agents directly within your IDE (like Roo Code).

You are the architect; the swarm is your factory.

## How It Works

This system installs a local AI engine and knowledge base (`.stigmergy-core`) into your project. The engine can operate in two modes:

1.  **Autonomous Mode:** You provide a high-level goal, and the engine runs a continuous loop, dispatching a swarm of agents to plan, code, and test the entire application with no further intervention. This is the primary mode.
2.  **Supervised Mode:** The engine waits for your commands from a compatible IDE. This is useful for direct, supervised interaction with a single agent.

## Installation & Setup

### Step 1: Install and Configure

In your project's root directory, run the following command. This will copy the `.stigmergy-core` knowledge base and **automatically configure your `.roomodes` file** for IDE integration.

```bash
npx @randy888chan/stigmergy install
```

### Step 2: Configure Environment

Create a `.env` file in your project root by copying `.env.example`. You will need API keys for your LLM provider and Neo4j database.

### Step 3: Install Project Dependencies

Run `npm install` to ensure your project has all necessary dependencies.

---

## Usage

### Option 1: Autonomous Execution (The Factory)

This is the primary, hands-free mode.

1.  Create a file (e.g., `goal.txt`) with your high-level objective.
2.  Start the engine and point it to your goal file. The engine will run continuously in your terminal until the project is complete.

```bash
npm run stigmergy:start -- --goal goal.txt
```

### Option 2: Web UI Planning (The Design Studio)

If you prefer to do high-level strategic planning in an external web-based UI, you can build a self-contained bundle for a planning team.

1.  Run the build command for a team (e.g., `team-planning-crew`).
2.  This creates a single file: `dist/teams/team-planning-crew.txt`.
3.  Copy the contents of this file into your Web UI's system prompt for a fully context-aware planning session. The output of this session should be an `execution-blueprint.yml`.

```bash
npx stigmergy build --team team-planning-crew
``````
