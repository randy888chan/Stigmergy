# 🚀 Stigmergy - Autonomous AI Development System

**Stigmergy is a modern, autonomous development system that transforms high-level product goals into production-ready code. It's built on a fast, efficient Bun/Hono architecture and features a powerful swarm of AI agents that collaborate to build, test, and deploy software.**

[![Bun](https://img.shields.io/badge/Bun-1.x-yellow.svg)](https://bun.sh/)
[![Hono](https://img.shields.io/badge/Hono-4.x-orange.svg)](https://hono.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](#-testing)

Stigmergy simplifies the development process by allowing you to focus on your vision while AI agents handle the heavy lifting of implementation, debugging, and documentation.

---

## ✨ Core Features

-   **🤖 Autonomous Agent Swarm:** A team of specialized AI agents that can plan, code, debug, and analyze applications.
-   **🌐 Live Web Interaction:** Agents can see and interact with live webpages using an integrated Chrome DevTools toolset, enabling real-time UI/UX analysis and frontend debugging.
-   **🔌 Universal IDE Integration:** Flexible integration with any IDE (VS Code, Qoder, etc.) through a powerful CLI and a web-based dashboard.
-   **📊 Real-Time Observability:** A comprehensive Command & Control Dashboard to monitor costs, track tasks, and analyze agent behavior in real-time.
-   **⚡️ High-Performance Architecture:** Built with Bun and Hono for blazing-fast performance and a lightweight footprint.
-   **🧠 Advanced Model Integration:** Easily configurable model tiers, including specialized models like Codestral for code-related tasks.
-   **✅ Simplified Workflow:** Get started in minutes with simple `bun run dev` and `bun test` commands.

---

## 🏗️ System Architecture

Stigmergy's architecture is built for flexibility, centering around a powerful agent engine that can be controlled in two primary ways:

1.  **CLI-First Workflow:** For direct, task-oriented execution from any IDE's terminal. You invoke the `stigmergy` CLI for a specific mission, and the engine runs, streams output, and exits upon completion.
2.  **Server & Dashboard Workflow:** For a more visual and interactive experience. You run the `bun run dev` server, which launches the engine and a web-based dashboard. This allows you to set the active project, initiate missions, and observe the agent swarm in real-time.

Both workflows utilize the same core components: a swarm of specialized AI agents, an extensible tool library, and a robust state management system.

---

## 🚀 Getting Started: A Step-by-Step Guide

This guide will walk you through setting up the Stigmergy engine, connecting the dashboard, and integrating it with your IDE.

**Prerequisites:**
*   [Bun](https://bun.sh/) installed on your system.
*   An API key from an AI provider.

### **Step 1: Installation & Configuration**

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-repo/stigmergy.git
    cd stigmergy
    ```

2.  **Install Dependencies:**
    ```bash
    bun install
    ```

3.  **Configure Your Environment:**
    Copy the `.env.example` file to `.env` and add your AI provider API keys.
    ```bash
    cp .env.example .env
    # Now, open .env and add your keys
    ```

### **Step 2: Run the Engine & Dashboard**

1.  **Start the Development Server:**
    ```bash
    bun run dev
    ```
    This command starts the high-performance Hono server, which powers both the agent engine and the web dashboard.

2.  **Open the Command & Control Dashboard:**
    Navigate to **`http://localhost:3010`** in your web browser. You will see the live dashboard interface.

3.  **Set Your Active Project:**
    The engine needs to know which project you want to work on.
    *   In the dashboard header, find the "Project Selector" input field.
    *   Enter the **full, absolute path** to your project's directory.
    *   Click **"Set Active Project"**. The dashboard will update to show your selected project, and the engine is now ready to work on it.

### **Step 3: Connect Your IDE (The New CLI-First Way)**

Our new CLI-first approach simplifies IDE integration. Instead of complex model configurations, you now use a simple command.

#### **For `continue.dev` (VS Code)**

1.  **Install `continue.dev`:**
    If you haven't already, install the [continue.dev extension](https://marketplace.visualstudio.com/items?itemName=Continue.continue) from the VS Code Marketplace.

2.  **Configure a Slash Command:**
    Open your `continue.dev` configuration file (`~/.continue/config.json` or `.continue/config.json`) and add the following to the `slashCommands` array:

    ```json
    {
      "slashCommands": [
        {
          "name": "stigmergy",
          "description": "Run a Stigmergy mission",
          "options": {
            "command": "stigmergy run --goal \"{{{ input }}}\""
          }
        }
      ]
    }
    ```

3.  **Usage:**
    In the `continue.dev` input box, type `/stigmergy` followed by your goal. For example:
    ```
    /stigmergy Fix the authentication bug
    ```
    This will execute the command directly in your integrated terminal, and you will see the mission status streamed live.

#### **For Qoder, Cursor, Trae, and any other IDE**

The beauty of the CLI-first approach is its universality. For any IDE with a built-in terminal:

1.  **Open the Terminal:** Open your IDE's integrated terminal.
2.  **Navigate to Your Project:** `cd /path/to/your/project`
3.  **Run the Command:**
    ```bash
    stigmergy run --goal "Your high-level objective here"
    ```
    The mission status will be streamed directly into your terminal, providing a universal and reliable integration for any development environment.

### **Step 4: Run Tests**
To ensure everything is working correctly, run the full test suite:
```bash
bun test
```

---

## 📚 Documentation

For more detailed information, please refer to our comprehensive guides:

-   **[AGENT_DEVELOPMENT_GUIDE.md](./docs/AGENT_DEVELOPMENT_GUIDE.md):** Learn how to create and configure new agents.
-   **[TOOL_DEVELOPMENT_GUIDE.md](./docs/TOOL_DEVELOPMENT_GUIDE.md):** A guide to adding new tools to the Stigmergy system.
-   **[MCP_INTEGRATION.md](./docs/MCP_INTEGRATION.md):** Instructions for integrating Stigmergy with your IDE.
-   **[OBSERVABILITY.md](./docs/OBSERVABILITY.md):** An overview of the Command & Control Dashboard and other monitoring features.
-   **[BENCHMARK_EXECUTION_SYSTEM.md](./docs/BENCHMARK_EXECUTION_SYSTEM.md):** Information on our benchmark suite for performance validation.
-   **[provider-configuration.md](./docs/provider-configuration.md):** A guide to configuring different AI providers.

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit pull requests or open issues.

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.