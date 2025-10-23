# Stigmergy - The Autonomous AI Development System

**Stigmergy is a CLI-first autonomous AI development system designed for seamless integration with your local Integrated Development Environment (IDE).**

It empowers a swarm of specialized AI agents to autonomously analyze, plan, and execute complex software development tasks. It operates directly on your local codebase in a safe, sandboxed environment, providing a powerful partner for professional developers.

---

## Core Philosophy: A Local-First, CLI-Driven Workflow

Stigmergy is designed to be a tool you run on your own machine. It is not a cloud service. This ensures maximum privacy, security, and control over your codebase.

*   **Global Service, Local Execution:** You run the Stigmergy engine as a single, persistent Docker container. This "factory" is then commanded to work on any of your local project repositories.
*   **CLI as the "Source of Truth":** The command line is the primary interface for initiating, monitoring, and managing tasks. This ensures maximum compatibility, scriptability, and transparent control.
*   **Dashboard for Observability:** A real-time web dashboard provides a visual, read-only "Command & Control" view of the agent swarm's activity, allowing you to monitor their thoughts, actions, and progress.

## Getting Started: The Docker-First Workflow

Using Docker is the recommended way to run Stigmergy, as it guarantees a consistent and isolated environment.

### Step 1: Clone and Configure the Engine

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-repo/stigmergy.git
    cd stigmergy
    ```

2.  **Configure Your Environment:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env.development
        ```
    *   Open `.env.development` and add your API keys (e.g., `OPENROUTER_API_KEY`).

### Step 2: Build and Run the Engine with Docker

1.  **Launch with Docker Compose:** This single command builds the Stigmergy engine image and starts the service container.
    ```bash
    docker-compose up --build
    ```
    The Stigmergy "factory" is now running and listening for commands. You can access the real-time dashboard at `http://localhost:3010`.

### Step 3: Link the CLI Tool

To easily command the Stigmergy engine from any terminal, you need to link the CLI package.

1.  **Navigate to the CLI package:**
    ```bash
    cd packages/stigmergy-cli
    ```
2.  **Link the package:** This makes the `stigmergy` command globally available.
    ```bash
    npm link
    ```

### Step 4: Run Your First Mission

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

## 🚀 Advanced Usage: Team Mode

Stigmergy can operate in "Team Mode," where multiple developers can connect their local engines to a single, shared project state. This is managed by a central `team-server`.

### How it Works

*   The **Team Server** acts as the central source of truth for the project's mission plan and status.
*   Each developer's local **Stigmergy Engine** connects to this server, syncing state instead of managing it locally.

### Running in Team Mode

1.  **Start the Team Server:**
    Use Docker Compose to start both the main engine and the team server.
    ```bash
    # Make sure you've already run `docker-compose up --build` at least once
    docker-compose up team-server
    ```
    The team server will be running on `http://localhost:3012`.

2.  **Configure Your Local Engine for Team Mode:**
    *   Open `stigmergy.config.js` in the main Stigmergy project.
    *   Modify the `collaboration` object to enable team mode:
        ```javascript
        collaboration: {
          mode: 'team', // 'single-player' or 'team'
          server_url: 'http://localhost:3012' // URL of your running team server
        }
        ```
    *   Restart your main Stigmergy engine (`docker-compose restart stigmergy`) for the changes to take effect.

Now, when you run missions, your engine will coordinate with the central team server.

## 🆘 Troubleshooting: Hard Reset Protocol

If the Docker environment enters a corrupted state, you can perform a hard reset to purge all caches and volumes.

**Run the following command from the `stigmergy` project root:**
```bash
docker-compose down -v
```
This will stop and remove all Docker containers, networks, and volumes, allowing you to start fresh with `docker-compose up --build`.
