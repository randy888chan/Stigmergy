# Pheromind: The Autonomous Development System

Pheromind is an autonomous development system that translates your strategic vision into production-ready applications. It operates as a local AI engine, powering agents directly within your IDE.

You are the architect; the swarm is your workshop.

## How It Works

Pheromind now runs as a local server engine. When you interact with an agent in a compatible IDE (like Roo Code), the IDE sends your request to the local engine. The engine orchestrates the entire workflow—calling the LLM, using tools to read and write files, analyzing your code, and running commands—before returning the final result to your IDE.

## Installation & Setup

### Step 1: Install Dependencies

Clone the repository and install the required packages.
```bash
git clone https://github.com/randy888chan/Stigmergy.git
cd Stigmergy
npm install
```

### Step 2: Configure Environment

You will need API keys for your LLM provider and Neo4j database. Create a `.env` file in the project root (you can copy `.env.example`) and add your credentials:
```
# .env

# LLM Provider (e.g., OpenAI)
LLM_API_KEY=your_openai_api_key_here

# Neo4j Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password
```

### Step 3: Run the Installer

The installer configures your project and IDE to communicate with the engine.
```bash
npm run install
```

## Usage

### Step 1: Start the Engine

In a dedicated terminal, start the Pheromind engine. It will run in the background.
```bash
npm run engine:start
```

### Step 2: (Optional) Index Your Codebase

To give your agents deep context about your code, run the indexer. This only needs to be done once, or when you make significant changes.
```bash
npm run indexer:run
```

### Step 3: Interact in Your IDE

Open your project in a configured IDE (e.g., VS Code with Roo Code). Activate an agent like `@winston` and give it a high-level goal. The agent in your IDE will now have the full power of the local engine and its tools.
```
@winston *create_blueprint "Build a new e-commerce site from scratch."
```
The engine will handle the rest.
