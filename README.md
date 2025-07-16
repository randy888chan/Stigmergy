# Pheromind: The Autonomous AI Development System

Pheromind is an autonomous development system that translates your strategic vision into production-ready applications, all from within your IDE.

## The Workflow: IDE-Centric Autonomy

The system is designed to be controlled entirely from a compatible IDE like Roo Code. The process is a seamless blend of your strategic oversight and the swarm's autonomous execution.

1.  **Start the Engine:** In your IDE's terminal, start the engine in a dormant state. It will wait for your command.
    ```bash
    npm run stigmergy:start
    ```
2.  **Launch the Project:** In your Roo Code chat, engage the chief orchestrator, `@saul`, with your high-level project goal.
    ```
    @saul start a new project to build a minimalist blog platform on Vercel.
    ```
3.  **Autonomous Planning:** The engine will engage, and the swarm will begin the planning process (creating a brief, PRD, etc.). You can monitor its progress in the terminal.
4.  **Approve Milestones:** After each major planning document is drafted, the engine will pause and log that it is `AWAITING APPROVAL`. To resume the autonomous process, simply tell the orchestrator to proceed.
    ```    @saul *approve*
    ```
5.  **Autonomous Execution & Completion:** Once the blueprint is approved, the system will execute all coding tasks without interruption until the final application is built according to the approved plans.

---
## Installation & Setup

### Step 1: Install and Configure

In your project's root directory, run the following command. This will copy the `.stigmergy-core` knowledge base and **automatically configure your `.roomodes` file** for IDE integration.
```bash
npx @randy888chan/stigmergy install
```

### Step 2: Configure Environment

Create a `.env` file in your project root by copying `.env.example`. You will need API keys for your LLM provider and other services.

### Step 3: Install Project Dependencies

Run `npm install` to ensure your project has all necessary dependencies.

---
## Optional: Web UI Planning

If you prefer to do high-level strategic planning in an external web-based UI, you can build a self-contained bundle for a planning team.

1.  Run the build command for a team (e.g., `team-planning-crew`).
2.  This creates a single file: `dist/teams/team-planning-crew.txt`.
3.  Copy the contents of this file into your Web UI's system prompt for a fully context-aware planning session.

```bash
npm run build --team team-planning-crew
```
