# Stigmergy - The Autonomous AI Development System

**Stigmergy is a CLI-first autonomous AI development system designed for seamless integration with your local Integrated Development Environment (IDE).**

It empowers a swarm of specialized AI agents to autonomously analyze, plan, and execute complex software development tasks. It operates directly on your local codebase in a safe, sandboxed environment, providing a powerful partner for professional developers.

---

## Core Philosophy: A Local-First, CLI-Driven Workflow

Stigmergy is designed to be a tool you run on your own machine. It is not a cloud service. This ensures maximum privacy, security, and control over your codebase.

*   **Global Service, Local Execution:** You run the Stigmergy engine as a single, persistent background service. This "factory" is then commanded to work on any of your local project repositories.
*   **CLI as the "Source of Truth":** The command line is the primary interface for initiating, monitoring, and managing tasks. This ensures maximum compatibility, scriptability, and transparent control.
*   **Dashboard for Observability:** A real-time web dashboard provides a visual, read-only "Command & Control" view of the agent swarm's activity, allowing you to monitor their thoughts, actions, and progress.

## Core Capabilities

*   **Autonomous Multi-Agent Swarm:** Specialized agents for planning (`@specifier`), execution (`@executor`), quality assurance (`@qa`), and debugging (`@debugger`) work together to achieve high-level goals.
*   **Deep Code Intelligence (CodeRAG):** The system builds a Neo4j knowledge graph of your codebase, allowing agents to perform deep, structural, and semantic analysis before writing a single line of code.
*   **"Review and Refine" Quality Gates:** Critical documents, like implementation plans, are automatically peer-reviewed by other agents to ensure quality and robustness before execution begins.
*   **Live Web Analysis (Chrome DevTools):** The `@ux-expert` and `@debugger` agents can launch a live Chrome browser to inspect and debug web applications in real-time.
*   **Universal IDE Integration:** A simple, robust CLI command (`stigmergy run`) allows for easy integration with any modern IDE, including VS Code (via `continue.dev`), Qoder, and Cursor.

---

## Getting Started: A Step-by-Step Guide

### Step 1: Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/randy888chan/stigmergy.git
    cd stigmergy
    ```

2.  **Install Dependencies:** Stigmergy uses `bun` as its runtime.
    ```bash
    bun install
    ```

3.  **Link the CLI:** This makes the `stigmergy` command available everywhere on your system.
    ```bash
    npm link
    ```

4.  **Configure Your Environment:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env.development
        ```
    *   Open `.env.development` and add your API keys (e.g., `OPENROUTER_API_KEY`) and your local Neo4j database credentials.

### Step 2: Start the Stigmergy Service

The Stigmergy engine runs as a background service. You only need to do this once.

*   **Start the Service:**
    ```bash
    stigmergy start-service
    ```
*   **Check the Status:**
    ```bash
    stigmergy service-status
    ```
    You should see a green "online" status. Your Stigmergy "factory" is now running and listening for commands. You can also access the real-time dashboard at `http://localhost:3010`.

### Step 3: Run Your First Mission (CLI Workflow)

This is the primary way to interact with Stigmergy.

1.  **Navigate to Your Project:** Open a terminal in the project repository you want Stigmergy to work on.
    ```bash
    cd /path/to/your/project-to-fix
    ```

2.  **Launch the Mission:** Use the `stigmergy run` command with a high-level goal.
    ```bash
    stigmergy run --goal "Fix the bug described in issue #247 where the login button is disabled incorrectly."
    ```
    or for an interactive chat session:
    ```bash
    stigmergy run
    ```

Stigmergy will now set the active project context, and the autonomous swarm will begin its work. You can monitor its progress in the terminal and on the dashboard.

### Step 4 (Optional): IDE Integration (`continue.dev`)

You can integrate Stigmergy directly into VS Code for a seamless workflow.

1.  **Install `continue.dev`:** Install the extension from the VS Code Marketplace.
2.  **Configure Your Global Settings:** Open the `continue.dev` global `config.yaml` file (use the command `Continue: Edit config.yaml`) and add the Stigmergy model:
    ```yaml
    models:
      # ... your other models
      - title: Stigmergy
        provider: openai-compatible
        model: stigmergy-mcp
        apiBase: http://localhost:3010/mcp
        apiKey: EMPTY
    ```
3.  **Use in any Project:** Now, in any of your projects, you can open the `continue.dev` panel, select "Stigmergy" from the model dropdown, and give it a command. It will connect to your running service.

---
