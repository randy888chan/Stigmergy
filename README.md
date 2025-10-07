# 🚀 Stigmergy - Autonomous AI Development System

**Stigmergy is a modern, autonomous development system that transforms high-level product goals into production-ready code. It's built on a fast, efficient, Bun-native architecture and uses a powerful "CLI-First" model for robust and flexible operation.**

[![Bun](https://img.shields.io/badge/Bun-1.x-yellow.svg)](https://bun.sh/)
[![Hono](https://img.shields.io/badge/Hono-4.x-orange.svg)](https://hono.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](#-running-tests)

Stigmergy simplifies the development process by allowing you to focus on your vision while AI agents handle the heavy lifting of implementation, debugging, and documentation. Our new CLI-first approach ensures maximum reliability and seamless integration with any development environment.

---

## ✨ Core Features

-   **🤖 Autonomous Agent Swarm:** A team of specialized AI agents that can plan, code, debug, and analyze applications.
-   **🔌 Universal CLI-First Integration:** The `stigmergy` command-line tool provides a single, reliable entry point for running development tasks, making it compatible with any IDE, including VS Code, Qoder, Cursor, and more.
-   **🌐 Live Web Interaction:** Agents can see and interact with live webpages using an integrated Chrome DevTools toolset, enabling real-time UI/UX analysis and frontend debugging.
-   **📊 Real-Time Observability:** A web-based Command & Control Dashboard to monitor costs, track tasks, and analyze agent behavior in real-time.
-   **⚡️ High-Performance Architecture:** Built with Bun and Hono for blazing-fast performance and a lightweight footprint.
-   **🧠 Advanced Model Integration:** Easily configurable model tiers for different tasks.
-   **✅ Simplified Workflow:** Get started in minutes with simple `bun install` and `bun test` commands.

---

## 🏗️ System Architecture: CLI-First

Stigmergy's architecture is built for simplicity and power, centering around a universal command-line interface.

1.  **The `stigmergy` CLI:** This is the primary entry point for all development tasks. You invoke `stigmergy run` with a high-level goal, and the engine takes over. It streams output directly to your terminal and exits upon completion. This is the **only** supported method for running missions.
2.  **The Optional Dashboard:** For visual monitoring, a web-based dashboard can be run alongside the engine. Use the `dev` script to run both the server and the dashboard in watch mode:
    ```bash
    bun run dev
    ```
    This is a read-only observability tool that connects to the engine's state.

This approach eliminates the complex synchronization issues of previous versions and provides a clear, reliable, and universal workflow.

---

## 🚀 Getting Started: The Official Workflow

This guide will walk you through setting up the Stigmergy engine and integrating it with your IDE.

**Prerequisites:**
*   [Bun](https://bun.sh/) installed on your system.
*   An API key from an AI provider (e.g., OpenAI, Anthropic, Google).

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
    This single command installs all necessary packages for the CLI, engine, and dashboard.

3.  **Configure Your Environment:**
    Copy the `.env.example` file to `.env` and add your AI provider API keys.
    ```bash
    cp .env.example .env
    # Now, open .env and add your keys
    ```

### **Step 2: How to Run a Mission (IDE Integration)**

Our new CLI-first approach simplifies IDE integration to a single command.

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

#### **For Qoder, Cursor, Trae, and Any Other IDE**

The beauty of the CLI-first approach is its universality. For any IDE with a built-in terminal:

1.  **Open the Terminal:** Open your IDE's integrated terminal.
2.  **Navigate to Your Project:** `cd /path/to/your/project`
3.  **Run the Command:**
    ```bash
    stigmergy run --goal "Your high-level objective here"
    ```
    The mission status will be streamed directly into your terminal, providing a universal and reliable integration for any development environment.

### **Step 3: Running Tests**

To ensure everything is working correctly, run the full test suite:
```bash
bun test
```

---

## 📚 Documentation

-   **[AGENT_DEVELOPMENT_GUIDE.md](./docs/AGENT_DEVELOPMENT_GUIDE.md):** Learn how to create and configure new agents.
-   **[TOOL_DEVELOPMENT_GUIDE.md](./docs/TOOL_DEVELOPMENT_GUIDE.md):** A guide to adding new tools to the Stigmergy system.

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit pull requests or open issues.

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.