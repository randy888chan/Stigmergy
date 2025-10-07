# 🤖 Stigmergy Universal IDE Integration Guide

Stigmergy is designed for flexible integration into any development workflow. You can interact with the engine through our web-based dashboard for a visual experience or directly from your IDE's terminal for a fast, CLI-first approach.

---

## **Method 1: The "CLI-First" Approach (Recommended for IDEs)**

This is the most direct and universal way to integrate Stigmergy with any IDE that has a built-in terminal (VS Code, Qoder, Cursor, etc.). It leverages the Stigmergy CLI, which is the new standard for interaction.

### **How It Works**

The Stigmergy engine is invoked directly from your command line for a specific task. The engine starts, executes the mission, streams the output to your terminal, and then exits. This is efficient and avoids the need for a persistent background service.

### **Setup and Usage**

1.  **Navigate to Your Project:**
    Open your IDE's integrated terminal and navigate to the root of the project you want to work on.
    ```bash
    cd /path/to/your/project
    ```

2.  **Run the Stigmergy CLI:**
    Execute the mission using the `stigmergy` command, which is defined in the project's `package.json`.
    ```bash
    # Make sure you have the Stigmergy project cloned and dependencies installed
    # From your project's directory, you can invoke the CLI:
    stigmergy run --goal "Your high-level objective here"
    ```
    *(Note: If the `stigmergy` command isn't in your path, you may need to run it via the relative path to the cloned engine repo, or create an alias for convenience.)*

### **Example: Integrating with `continue.dev` in VS Code**

This is a powerful way to make Stigmergy a native part of your AI-assisted workflow.

1.  **Install `continue.dev`:**
    Get the [continue.dev extension](https://marketplace.visualstudio.com/items?itemName=Continue.continue) from the VS Code Marketplace.

2.  **Configure a Slash Command:**
    Open your `continue.dev` configuration file (`~/.continue/config.json` or `.continue/config.json` in your project) and add a slash command for Stigmergy:

    ```json
    {
      "slashCommands": [
        {
          "name": "stigmergy",
          "description": "Run a Stigmergy mission on your project",
          "options": {
            "command": "stigmergy run --goal \"{{{ input }}}\""
          }
        }
      ]
    }
    ```

3.  **Usage:**
    In the `continue.dev` input box, simply type `/stigmergy` followed by your goal.
    ```
    /stigmergy Refactor the user authentication flow to use a more secure JWT strategy.
    ```
    The command will run in your integrated terminal, giving you a live stream of the agent's progress.

---

## **Method 2: The Dashboard and Server Approach**

This method is ideal for monitoring, debugging, and getting a high-level overview of the agent swarm's activity.

### **How It Works**

You run the Stigmergy server persistently. You can then connect to it from the web dashboard to manage the active project and initiate missions.

### **Setup and Usage**

1.  **Start the Stigmergy Server:**
    In your terminal, navigate to the directory where you cloned the Stigmergy engine and run the development server.
    ```bash
    # In your stigmergy engine directory
    bun run dev
    ```

2.  **Open the Dashboard:**
    Open your web browser and go to **`http://localhost:3010`**.

3.  **Set the Active Project:**
    The engine needs to know which codebase to work on.
    *   In the dashboard's "Project Selector" input, enter the **full, absolute path** to your target project's directory.
    *   Click **"Set Active Project"**.

4.  **Start a Mission:**
    Use the chat interface in the dashboard to provide your high-level goal. The engine will start the mission in the context of the active project you just set.