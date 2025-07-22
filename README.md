# Stigmergy: The Autonomous AI Development System

Stigmergy is an autonomous development system that translates your strategic vision into production-ready applications, all from within your IDE.

## The Workflow: True Autonomy by Design

The Stigmergy system is designed for a single, powerful handoff. You provide the vision, and the AI swarm handles the rest in uninterruptible phases. All interaction happens via chat in your IDE.

1.  **Start the Engine (Once):** In your IDE's terminal, run the server. It will start in the background and wait for your command.
    ```bash
    node cli/index.js start
    ```

2.  **Launch the Project:** In your IDE's chat, tell the `@system` what you want to build. This is your one and only creative instruction.
    ```
    @system start a new project to build a minimalist blog platform on Vercel.
    ```

3.  **Autonomous "Grand Blueprint" Phase:** The system is now fully autonomous and uninterruptible. A specialized crew of planning agents will work sequentially to create a comprehensive set of project artifacts:
    *   All business & planning documents (`Project Brief`, `PRD`, `Architecture`).
    *   A complete, machine-readable `execution-blueprint.yml`.
    *   Detailed story files for **every single task** in the blueprint.
    *   An index of your existing codebase in the Neo4j graph database for context-awareness.

4.  **The Single "Go/No-Go" Decision:** Once the entire plan is complete, the system will pause and notify you. This is your **single point of approval**. Review the generated `execution-blueprint.yml` and all documents in `docs/`.

5.  **Final Approval & Execution:** To give the final green light, simply give your consent in chat.
    ```
    @saul The plan looks solid. You are approved to begin execution.
    ```
    The system will now autonomously execute the entire blueprint without further interruption.

6.  **Final Input & Deployment:** The system will only pause again at the very end, to request secret keys (like API keys or wallet private keys) needed for final testing and deployment.

---
## Installation & Setup

### Step 1: Install Stigmergy

In your project's root directory, run the following command. This will copy the `.stigmergy-core` knowledge base and automatically configure your `.roomodes` file.

```bash
npx @randy888chan/stigmergy install
