# Pheromind: The Autonomous AI Development System

Pheromind is an autonomous development system that translates your strategic vision into production-ready applications. It operates as a local AI engine, powering agents directly within your IDE.

You are the architect; the swarm is your workshop.

## How It Works

This system is a command-line tool that installs a local AI engine and knowledge base into your project. When you interact with an agent in a compatible IDE (like Roo Code), the IDE sends your request to the local engine. The engine orchestrates the entire workflow—calling LLMs, using tools to read and write files, analyzing your code via a code graph, and running commands—before returning the final result to your IDE.

## Installation & Setup

### Step 1: Install and Run the Installer

In your project's root directory, run the following command. This will install the `.stigmergy-core` knowledge base and configure your project.
```bash
npx @randy888chan/stigmergy install
```

### Step 2: Configure Environment

The installer will prompt you to create a `.env` file if one doesn't exist. You will need API keys for your LLM provider and Neo4j database.
```
# .env

# LLM Provider (e.g., OpenAI, OpenRouter, local models)
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your_api_key_here

# Neo4j Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password
```

### Step 3: Install Project Dependencies
Run `npm install` to ensure your project has all necessary dependencies, including those added by the installer.

## Usage

### Step 1: Start the Engine

The installer added a script to your `package.json`. In a dedicated terminal, start the Pheromind engine. It will run in the background.
```bash
npm run stigmergy:start
```

### Step 2: (Optional) Index Your Codebase

To give your agents deep context about your code, run the indexer. This only needs to be done once, or when you make significant changes.
```bash
npm run stigmergy:index
```

### Step 3: Interact in Your IDE

Open your project in a configured IDE (e.g., VS Code with Roo Code). Activate an agent like `@winston` and give it a high-level goal. The agent in your IDE will now have the full power of the local engine.
```
@winston *create_blueprint "Build a new e-commerce site from scratch."
```
The engine will handle the rest.


**The Corrected User Experience:**

1.  You run `npx @randy888chan/stigmergy install` to set up your project.
2.  For **autonomous execution**, you run `npm run stigmergy:start` to use the local engine.
3.  For **Web UI planning**, you now run a new command:
    ```bash
    npx stigmergy build --agent mary
    ```    This command will read the agent file for `@mary`, find all its dependencies (checklists, tasks, etc.), and bundle them into a single file: `dist/mary.txt`. You can then copy the contents of this file into any Web UI for your planning session.

This gives you the best of both worlds, exactly as we intended.
