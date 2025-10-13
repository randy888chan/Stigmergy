# Stigmergy - The Autonomous AI Development System

**Stigmergy is a CLI-first autonomous AI development system designed for seamless integration with your local Integrated Development Environment (IDE).**

It empowers a swarm of specialized AI agents to autonomously analyze, plan, and execute complex software development tasks. It operates directly on your local codebase in a safe, sandboxed environment, providing a powerful partner for professional developers.

---

## Core Philosophy: A Local-First, CLI-Driven Workflow

Stigmergy is designed to be a tool you run on your own machine. It is not a cloud service. This ensures maximum privacy, security, and control over your codebase.

*   **Global Service, Local Execution:** You run the Stigmergy engine as a single, persistent background service. This "factory" is then commanded to work on any of your local project repositories.
*   **CLI as the "Source of Truth":** The command line is the primary interface for initiating, monitoring, and managing tasks. This ensures maximum compatibility, scriptability, and transparent control.
*   **Dashboard for Observability:** A real-time web dashboard provides a visual, read-only "Command & Control" view of the agent swarm's activity, allowing you to monitor their thoughts, actions, and progress.

## Getting Started: A Step-by-Step Guide

### Step 1: Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-repo/stigmergy.git
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
    *   Open `.env.development` and add your API keys (e.g., `OPENROUTER_API_KEY`).

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
    stigmergy run --goal "Refactor the authentication module to use JWT instead of session cookies."
    ```
    or for an interactive chat session:
    ```bash
    stigmergy run
    ```

Stigmergy will now set the active project context, and the autonomous swarm will begin its work. You can monitor its progress in the terminal and on the dashboard.

## Development with Docker (Recommended)

To ensure a consistent and reproducible development environment, we recommend using Docker. This avoids local setup issues.

1.  **Prerequisites:** Make sure you have Docker and Docker Compose installed.

2.  **Environment Setup:** Copy the `.env.example` file to `.env.development` and fill in your API keys.
    ```bash
    cp .env.example .env.development
    ```

3.  **Build and Run:** Use Docker Compose to build and start the development service. This now uses an AI-safe development server by default.
    ```bash
    docker-compose up --build stigmergy-dev
    ```

Your development server will be available at `http://localhost:3010`. Any changes you make to the source code on your local machine will trigger an automatic restart inside the container.