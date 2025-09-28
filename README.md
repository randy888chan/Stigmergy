# 🚀 Stigmergy - Autonomous AI Development System

**Stigmergy is a modern, autonomous development system that transforms high-level product goals into production-ready code. It's built on a fast, efficient Bun/Hono architecture and features a powerful swarm of AI agents that collaborate to build, test, and deploy software.**

[![Bun](https://img.shields.io/badge/Bun-1.x-yellow.svg)](https://bun.sh/)
[![Hono](https://img.shields.io/badge/Hono-4.x-orange.svg)](https://hono.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](#-testing)

Stigmergy simplifies the development process by allowing you to focus on your vision while AI agents handle the heavy lifting of implementation, debugging, and documentation.

---

## ✨ Core Features

-   **🤖 Autonomous Agent Swarm:** A team of specialized AI agents (@ux-expert, @debugger, @executor) that can plan, code, debug, and analyze applications.
-   **🌐 Live Web Interaction:** Agents can see and interact with live webpages using an integrated Chrome DevTools toolset, enabling real-time UI/UX analysis and frontend debugging.
-   **💼 VC-Grade Business Planning:** Upgraded tools for generating professional, 5-year financial projections and comprehensive business plans.
-   **⚡️ High-Performance Architecture:** Built with Bun and Hono for blazing-fast performance and a lightweight footprint.
-   **🧠 Advanced Model Integration:** Easily configurable model tiers, including specialized models like Codestral for code-related tasks.
-   **✅ Simplified Workflow:** Get started in minutes with simple `bun run dev` and `bun test` commands.

---

## 🏗️ System Architecture

Our new architecture is designed for simplicity, speed, and power. The Hono server acts as the central hub, managing WebSocket connections for real-time communication and orchestrating the agent swarm.

```
┌───────────────────────────────┐
│         User / IDE            │
└───────────────┬───────────────┘
                │ (WebSocket)
┌───────────────▼───────────────┐
│     Hono Web Server           │
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
│  - ...and more                │
└───────────────┬───────────────┘
                │
┌───────────────▼───────────────┐
│           Tool Library        │
├───────────────────────────────┤
│  - chrome_devtools_tool       │
│  - file_system                │
│  - business_verification      │
│  - ...and more                │
└───────────────────────────────┘
```

---

## 🚀 Quick Start

Getting started with Stigmergy is now easier than ever.

**Prerequisites:**
*   [Bun](https://bun.sh/) installed on your system.
*   A Neo4j database (optional but recommended for full functionality).

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
Copy the new, user-friendly `.env.example` file to `.env` and add your API keys.
```bash
cp .env.example .env
# Now, open .env and add your keys
```
Our new `.env.example` is designed to be clean and easy to understand, getting you set up in seconds.

**4. Run the Development Server:**
```bash
bun run dev
```
This single command starts the Hono server, and you're ready to go!

**5. Run Tests:**
To ensure everything is working correctly, run the test suite:
```bash
bun test
```

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit pull requests or open issues.

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.