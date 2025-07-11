# Contributing to Stigmergy

Thank you for your interest in contributing to the Stigmergy project! This guide provides a simple and robust workflow for local development and testing.

## Local Development Setup

This workflow ensures that you can develop the `Stigmergy` package and test its functionality in a separate project without conflicts.

### Step 1: Clone and Install Dependencies

First, set up the core `Stigmergy` repository.

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/randy888chan/Stigmergy.git
    cd Stigmergy
    ```

2.  **Install Dependencies:**
    This command will *only* install the required `node_modules`. It will not trigger any installation scripts.
    ```bash
    npm install
    ```

### Step 2: Create a Global Symlink

From the root of your local `Stigmergy` directory, create a global link to your package. This tells your computer that whenever another project asks for `@randy888chan/stigmergy`, it should use your local version.

```bash
npm link
```

### Step 3: Use Your Local Version in a Test Project

1.  **Create or Navigate to a Test Project:**
    It is highly recommended to have a separate, simple folder to test your changes.
    ```bash
    mkdir ~/stigmergy-test-project
    cd ~/stigmergy-test-project
    npm init -y # Initialize a dummy package.json
    ```

2.  **Link Your Local Stigmergy Package:**
    This command tells your test project to use the globally linked version of `Stigmergy` (your local copy).
    ```bash
    npm link @randy888chan/stigmergy
    ```

### Step 4: Test Your Changes

You can now run the `stigmergy` command inside your test project. Any changes you save in your `Stigmergy` source code will be reflected immediately.

For example, to test the installer:
```bash
# Inside ~/stigmergy-test-project
stigmergy install
```

## Development Commands

-   **`npm run build`**: Build all agent and team bundles.
-   **`npm run build -- --agent <agentId>`**: Build a bundle for a single agent (e.g., `mary`). Essential for rapid testing in Web UIs.
-   **`npm run validate:agents`**: Validate the YAML configuration of all agent files. Run this before committing changes to agents.
-   **`npm run format`**: Format all project files with Prettier.
