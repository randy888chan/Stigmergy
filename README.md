# Stigmergy - A CLI-First AI Swarm for Software Development

Stigmergy is a powerful, command-line-driven system that uses a swarm of AI agents to autonomously accomplish complex software engineering tasks. It is designed for developers who are comfortable working in a terminal and want to integrate AI capabilities directly into their existing workflows.

## Core Philosophy: CLI-First

The primary interface for Stigmergy is the `stigmergy` command-line tool, powered by Bun. While a web-based dashboard exists for observability, all core actions—from running tasks to managing projects—are designed to be executed from the terminal. This "CLI-First" approach ensures maximum flexibility, scriptability, and integration with standard development environments.

## Quick Start

### Prerequisites

*   **Bun:** Stigmergy is built on the Bun runtime. Installation is simple:
    ```bash
    curl -fsSL https://bun.sh/install | bash
    ```
*   **API Keys:** You will need API keys for your chosen AI models. Configure them in a `.env` file in the project root. See `env.example` for the required format.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/stigmergy.git
    cd stigmergy
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

### Running a Mission

The core of Stigmergy is the `run` command. Provide it with a high-level goal, and the AI swarm will work to achieve it.

```bash
bun run stigmergy run --goal "Refactor the authentication service to use a more secure hashing algorithm and then write integration tests for it."
```

The system will automatically select the right agents, create a sandboxed environment for the work, and execute the plan.

## IDE Integration

Integrate Stigmergy with your favorite IDE (like VS Code, Zed, or Cursor) by using its built-in terminal. This allows you to run missions and interact with the AI swarm without leaving your development environment.

1.  Open the Stigmergy project in your IDE.
2.  Open the integrated terminal (`Ctrl+` or `Cmd+`).
3.  Run a mission directly from the terminal:
    ```bash
    bun run stigmergy run --goal "Implement the user profile page based on the new Figma designs."
    ```

This workflow keeps all your tools—code editor, terminal, and AI swarm—in one place, providing a seamless and efficient development experience.

## The Dashboard (Optional)

For a read-only view of the swarm's activity, you can launch the optional web dashboard.

1.  **Start the server:**
    ```bash
    bun run dev
    ```
2.  **View the dashboard:** Open your browser to `http://localhost:3011`.

The dashboard is useful for observing agent states, watching file changes in real-time, and reviewing logs, but it is not required for running the system.