# Stigmergy - The Autonomous AI Development System

**Stigmergy is a CLI-first autonomous AI development system designed for seamless integration with your local Integrated Development Environment (IDE).**

It empowers a swarm of specialized AI agents to autonomously analyze, plan, and execute complex software development tasks. It operates directly on your local codebase in a safe, sandboxed environment, providing a powerful partner for professional developers.

---

## 🚀 Getting Started: The 5-Minute Onboarding Wizard

The recommended way to get started with Stigmergy is by using the interactive setup wizard. This ensures a consistent, validated, and correctly configured environment.

### Step 1: Clone the Repository

First, clone the Stigmergy source code to your local machine.

```bash
git clone https://github.com/your-repo/stigmergy.git
cd stigmergy
```

### Step 2: Install Dependencies

Next, install all the necessary dependencies using Bun. This single command installs packages for the core engine, the CLI, and all other local utilities.

```bash
bun install
```

### Step 3: Link the CLI Tool

To make the `stigmergy` command available system-wide, link the CLI package.

1.  **Navigate to the CLI package:**
    ```bash
    cd packages/stigmergy-cli
    ```
2.  **Link the package:**
    ```bash
    npm link
    ```
3.  **Return to the project root:**
    ```bash
    cd ../..
    ```

### Step 4: Run the Setup Wizard

Now, run the interactive setup wizard. This is the primary command for all new users.

```bash
stigmergy setup
```

The wizard will guide you through the entire process:
1.  **Initializing** the required `.stigmergy-core` directory structure.
2.  **Configuring** your AI provider by asking for API keys.
3.  **Creating** a `.env.development` file automatically.
4.  **Verifying** your complete setup with a comprehensive health check.
5.  **Starting** the Stigmergy engine for you.

Once the wizard is complete, you are ready to run your first mission! The engine will be running in the background, and you can access the dashboard at `http://localhost:3010`.

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

## 🔒 Production Deployment: Secure Secrets Management

For production or team environments, using a dedicated secrets manager is **required** to ensure security and proper configuration. Stigmergy integrates with [Doppler](https://www.doppler.com/) as the primary and prioritized method for handling secrets.

### How it Works

When the `stigmergy login` command is used, the system securely fetches all secrets from your Doppler project and injects them as environment variables. **If a Doppler token is detected, the system will completely ignore any `.env` files**, ensuring that Doppler remains the single source of truth for all secrets.

For local development, you can still use a `.env.development` file for convenience, but for any production-like or shared environment, Doppler is the required standard.

### Step 1: Log in with Doppler

To configure your environment with Doppler, use the `login` command.

1.  **Get your Doppler Service Token:**
    *   Go to your Doppler project.
    *   Navigate to the `config` you want to use (e.g., `prd`).
    *   Find the `DOPPLER_TOKEN` value. This is your service token.

2.  **Run the login command:**
    ```bash
    stigmergy login <your-doppler-service-token>
    ```
    This command saves your token securely to a local configuration file at `~/.stigmergy/config.json`.

### Step 2: Restart the Engine

After logging in, restart the Stigmergy engine. It will automatically detect the token and begin fetching secrets from Doppler, securely providing API keys and other credentials to the system.

## 🆘 Troubleshooting: Hard Reset Protocol

If the Docker environment enters a corrupted state, you can perform a hard reset to purge all caches and volumes.

**Run the following command from the `stigmergy` project root:**
```bash
docker-compose down -v
```
This will stop and remove all Docker containers, networks, and volumes, allowing you to start fresh with `docker-compose up --build`.
