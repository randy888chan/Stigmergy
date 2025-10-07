# Stigmergy - The Autonomous AI Development System

**Stigmergy is a CLI-first autonomous AI development system designed for seamless integration with your local Integrated Development Environment (IDE) through the Universal Malleable Communications Protocol (MCP).**

It empowers AI agents to tackle complex software development tasks by providing them with a robust set of tools, a structured workflow, and direct access to your codebase in a safe, sandboxed environment.

---

## Core Philosophy: CLI-First, IDE-Integrated

Stigmergy is built on a "CLI-First" principle. The command line is the primary interface for initiating, monitoring, and managing AI-driven tasks. This ensures maximum compatibility, scriptability, and control for the developer.

The dashboard is a secondary, read-only observability tool that provides a visual representation of the agent swarm's activity and the project's state.

## Key Commands

The two primary commands you will use are `stigmergy start-service` and `stigmergy run`.

### 1. `stigmergy start-service`

This command starts the core Stigmergy engine, which includes the main server, the WebSocket endpoint for real-time updates, and the MCP server for IDE communication. You must have this service running in a terminal window before you can assign tasks.

```bash
# Start the Stigmergy engine and all related services
stigmergy start-service
```

Once running, the service will provide a local URL for the observability dashboard (e.g., `http://localhost:3010`).

### 2. `stigmergy run`

This is the command used to assign a new goal to the agent swarm. It sends the task to the running Stigmergy service and returns a mission ID.

There are two modes of operation:

#### A) Single Goal Mode (`--goal`)

This is the primary mode for autonomous operation. You provide a high-level objective, and the agent swarm will work to achieve it.

```bash
# Assign a high-level goal to the agent swarm
stigmergy run --goal "Refactor the authentication module to use JWT instead of session cookies."
```

#### B) Interactive Chat Mode

If you run the command without any arguments, it will launch an interactive chat session, allowing for a more conversational workflow.

```bash
# Start an interactive chat session with the Stigmergy system
stigmergy run
```

---

## Getting Started

1.  **Install Dependencies:**
    ```bash
    bun install
    ```

2.  **Set Up Environment:**
    Copy the `.env.example` file to a new file named `.env` and fill in your API keys (e.g., `OPENAI_API_KEY`, `GOOGLE_API_KEY`).

3.  **Start the Service:**
    Open a terminal window and run:
    ```bash
    stigmergy start-service
    ```

4.  **Assign a Goal:**
    Open a *second* terminal window and run:
    ```bash
    stigmergy run --goal "Your development task here"
    ```

5.  **Observe:**
    Open the dashboard URL provided by the `start-service` command in your browser to watch the agents work in real-time.