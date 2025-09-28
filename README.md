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
-   **🔌 Universal IDE Integration:** A persistent global service that integrates with any IDE (VS Code, Roo Code, etc.) through the Model-Context Protocol (MCP).
-   **📊 Real-Time Observability:** A comprehensive Command & Control Dashboard to monitor costs, track tasks, and analyze agent behavior in real-time.
-   **⚡️ High-Performance Architecture:** Built with Bun and Hono for blazing-fast performance and a lightweight footprint.
-   **🧠 Advanced Model Integration:** Easily configurable model tiers, including specialized models like Codestral for code-related tasks.
-   **✅ Simplified Workflow:** Get started in minutes with simple `bun run dev` and `bun test` commands.

---

## 🏗️ System Architecture

Our architecture is designed for simplicity, speed, and power. The Hono server acts as the central hub, managing WebSocket connections for real-time communication and orchestrating the agent swarm. Stigmergy runs as a persistent background service, allowing it to integrate with any development environment through the Model-Context Protocol (MCP).

```
┌───────────────────────────────┐
│      IDE (VS Code, etc.)      │
└───────────────┬───────────────┘
                │ (MCP over WebSocket)
┌───────────────▼───────────────┐
│  Stigmergy Global Service     │
├───────────────────────────────┤
│  - WebSocket Management       │
│  - Agent Orchestration        │
│  - Tool Registration          │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│         Agent Swarm           │
├───────────────────────────────┤
│  - @dispatcher (Manager)      │
│  - @ux-expert (UI/UX Analyst) │
│  - @debugger (Code Fixer)     │
│  - @executor (Coder)          │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│           Tool Library        │
├───────────────────────────────┤
│  - chrome_devtools_tool       │
│  - file_system                │
│  - code_intelligence          │
└───────────────────────────────┘
```

---

## 🚀 Quick Start

Getting started with Stigmergy is now easier than ever.

**Prerequisites:**
*   [Bun](https://bun.sh/) installed on your system.
*   An API key from an AI provider (see our [Provider Configuration Guide](./docs/provider-configuration.md)).

**1. Clone the Repository:**
```bash
git clone https://github.com/your-repo/stigmergy.git
cd stigmergy
```

**2. Install Dependencies:**
```bash
bun install
```

**3. Configure Your Environment:**
Copy the `.env.example` file to `.env` and add your API keys.
```bash
cp .env.example .env
# Now, open .env and add your keys
```

**4. Run the Development Server:**
```bash
bun run dev
```
This command starts the Hono server, and you're ready to go!

**5. Run Tests:**
To ensure everything is working correctly, run the test suite:
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