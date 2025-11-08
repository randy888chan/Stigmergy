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

- The **Team Server** acts as the central source of truth for the project's mission plan and status.
- Each developer's local **Stigmergy Engine** connects to this server, syncing state instead of managing it locally.

### Running in Team Mode

1.  **Start the Team Server:**
    Use Docker Compose to start both the main engine and the team server.

    ```bash
    # Make sure you've already run `docker-compose up --build` at least once
    docker-compose up team-server
    ```

    The team server will be running on `http://localhost:3012`.

2.  **Configure Your Local Engine for Team Mode:**
    - Open `stigmergy.config.js` in the main Stigmergy project.
    - Modify the `collaboration` object to enable team mode:
      ```javascript
      collaboration: {
        mode: 'team', // 'single-player' or 'team'
        server_url: 'http://localhost:3012' // URL of your running team server
      }
      ```
    - Restart your main Stigmergy engine (`docker-compose restart stigmergy`) for the changes to take effect.

Now, when you run missions, your engine will coordinate with the central team server.

## 🔒 Production Deployment: Secure API Key Management

For production or team environments, a Role-Based Access Control (RBAC) system is used to manage access and permissions. Authentication is handled via API keys, which are mapped to specific roles and users in a central configuration file.

### How it Works

The Stigmergy engine is protected by an authentication middleware that requires a valid API key for all incoming requests. This key determines the user's role and the permissions they have within the system.

The central configuration for this system is located at:
`.stigmergy-core/governance/rbac.yml`

This file defines roles, assigns permissions to them, and maps users to these roles along with their unique API keys.

### Step 1: Configure Your Admin Key

For a simple, single-user setup, you only need to configure the default admin key.

1.  **Open the RBAC configuration file:**
    ```bash
    code .stigmergy-core/governance/rbac.yml
    ```
2.  **Set your Admin Key:**
    Find the `default-admin` user and replace the default key with a new, secure, randomly generated string.
    ```yaml
    users:
      - username: default-admin
        role: Admin
        key: "stg_key_admin_your_new_secure_key_here" # <-- REPLACE THIS
    ```

### Step 2: Use the API Key in Your Client

All clients (like the CLI or custom scripts) that interact with the Stigmergy engine must provide this API key in the `Authorization` header.

**Example:**
When making a request, include the header `Authorization: Bearer stg_key_admin_your_new_secure_key_here`. The `stigmergy run` CLI and other integrated tools will automatically use the key configured for the `default-admin`.

### (Optional) Step 3: Create New Keys with the CLI

For multi-user or more complex setups, you can easily generate new API keys for different roles using the CLI.

```bash
stigmergy admin create-key <username> <RoleName>
```

**Example:**
To create a key for a new user named `dev-jane` with the `Developer` role:
```bash
stigmergy admin create-key dev-jane Developer
```
The command will output a new, secure API key for that user, which will also be automatically added to your `rbac.yml` file.

## 🆘 Troubleshooting: Hard Reset Protocol

If the Docker environment enters a corrupted state, you can perform a hard reset to purge all caches and volumes.

**Run the following command from the `stigmergy` project root:**

```bash
docker-compose down -v
```

This will stop and remove all Docker containers, networks, and volumes, allowing you to start fresh with `docker-compose up --build`.
