# 🚀 Stigmergy: The Autonomous AI Development Platform

Stigmergy is an enterprise-grade AI development system that lives on your machine. It doesn't just write code; it plans architectures, fixes bugs in existing apps, and answers questions about your codebase using a local Knowledge Graph.

## ✨ Key Capabilities

*   **🧠 Consultant Mode:** Chat with your codebase. Ask "How does authentication work?" and get an answer based on your actual files.
*   **🏗️ Enterprise Architect:** Scaffolds production-ready PERN stacks (Postgres, Express, React, Node) with Docker and TypeScript.
*   **🚑 Rescue Team:** A specialized agent squad designed to analyze and fix bugs in *other* existing projects on your machine.
*   **⚡ Async Task Queue:** Parallel processing of non-dependent tasks for maximum speed.
*   **🛡️ Self-Correction:** Includes a "Refiner Loop" where agents critique and fix their own code before saving.

## 🛠️ Quick Start (Local)

**Prerequisites:**
*   [Bun](https://bun.sh/) (v1.0+)
*   [Neo4j Desktop](https://neo4j.com/download/) (running locally on port 7687)

**1. Setup Environment**
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY and Neo4j credentials

**2. Install & Build**
bun install
bun run build:dashboard

**3. Launch the Engine**
bun run engine/main.js

**4. Access Mission Control**
Open http://localhost:3010 in your browser.

## 🎯 How to Use

### Creating a New App
In the Dashboard Chat:
> "Create a new Enterprise SaaS app in /workspace/my-saas-project"

### Fixing an Existing App
1. Ensure your broken app is in a folder accessible to Stigmergy.
2. In the Dashboard Chat:
> "Fix the database connection error in /workspace/old-legacy-app"

### Consulting
> "Consultant: Explain the folder structure of this project."

## 🧩 Architecture

*   **Frontend:** React 18 + Tailwind (Glassmorphism UI) + Monaco Editor (IDE).
*   **Backend:** Hono (High-performance Node server).
*   **Brain:** LangGraph for agent orchestration + Neo4j for long-term memory.
