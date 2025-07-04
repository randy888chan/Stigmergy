# Stigmergy: The Autonomous AI Development Swarm

Stigmergy is a framework for orchestrating a swarm of specialized AI agents to autonomously build software. It combines principles of swarm intelligence with agile development methodologies to create a system that can manage a project from planning to execution with minimal human intervention.

At its core, the system utilizes:

- **Swarm Intelligence (Stigmergy):** Agents interact indirectly by reading and writing to a shared state file (`.ai/state.json`), leaving a "digital scent" that guides the next agent's actions. This enables complex, coordinated behavior without direct communication.
- **AI-Verifiable Methodology:** Progress is measured by concrete, AI-confirmable outcomes recorded in the shared state, ensuring unparalleled transparency and reliability.
- **Constitutional AI:** All agents operate under a shared set of core principles (`bmad-core/system_docs/03_Core_Principles.md`), ensuring consistent, predictable, and safe behavior.

---

## 🚀 Installation

The Stigmergy framework includes an interactive installer that configures your project and integrates with your favorite IDE.

```bash
# Run this command in the root of your project folder
npx @randy888chan/stigmergy install
```

The installer will guide you through setting up the `.bmad-core` system, installing web bundles for UI-based planning, and configuring IDEs like Roo Code, TRAE AI IDE, Kilo Code, and Cline.

---

## Workflows

The Stigmergy workflow is divided into two distinct phases, designed to leverage the best of human strategy and autonomous AI execution.

### **Phase 1: Strategic Planning (Web UI or IDE)**

This initial phase is a collaboration between you and the "Planning Crew" agents (`@analyst`, `@pm`, `@architect`). The goal is to produce the foundational documents that define the project's "what" and "why".

1.  **Environment Setup:** After running the installer, you can use the pre-built `team-planning-crew.txt` bundle in a web UI like Gemini or Claude, or you can interact with the planning agents directly in your IDE.
2.  **Generate Core Documents:** Work conversationally with the agents. They are equipped with web search tools to perform market research and technical validation. Your objective is to create:
    *   `docs/prd.md` (Product Requirements Document)
    *   `docs/architecture.md` (System Architecture)
3.  **Save Artifacts:** Ensure these final documents are saved in your project's `docs/` folder. They are the official blueprint for the execution phase.

### **Phase 2: Autonomous Execution (IDE)**

Once the blueprint is defined, you hand off control to the autonomous swarm.

1.  **Initiate the Swarm:** In your IDE, activate the lead orchestrator, **`@bmad-orchestrator` (Olivia)**.
2.  **Give the Directive:** Provide a single, clear instruction:
    > "A new PRD and Architecture spec are in the `docs/` folder. Please begin project execution."
3.  **Observe and Support:** The swarm will now enter its autonomous loop:
    *   Olivia dispatches the `@bmad-master` (Saul) to analyze the documents and update the system state.
    *   Saul updates the state and hands back to Olivia.
    *   Olivia, reading the new state, dispatches worker agents (`@sm` to create stories, `@dev` to write code, `@qa` to test).
    *   This loop continues until the project defined in the `docs/` is complete. Your role is now supervisory, providing input only when an agent specifically requests human intervention.

---

## Available Agents

The system utilizes a suite of specialized AI agents. Key roles include:

| Agent ID              | Name (Role)                             | Core Responsibilities                                          |
| --------------------- | --------------------------------------- | -------------------------------------------------------------- |
| `@bmad-orchestrator`  | Olivia (Coordinator)                    | Dispatches tasks and manages the high-level project workflow.    |
| `@bmad-master`        | Saul (Scribe)                           | Reads worker reports and updates the shared system state file.   |
| `@analyst`            | Mary (Business Analyst)                 | Proactive market research, brainstorming, creating project briefs. |
| `@pm`                 | John (Product Manager)                  | Defines product strategy, roadmaps, and PRDs.                  |
| `@architect`          | Winston (Solution Architect)            | Designs system architecture and selects technology.              |
| `@sm`                 | Bob (Scrum Master)                      | Breaks down epics into detailed, actionable stories for Devs.  |
| `@dev`                | James (Developer)                       | Implements stories, writes code, and runs local tests.         |
| `@qa`                 | Quinn (QA Specialist)                   | Validates code against standards and acceptance criteria.      |
| `@po`                 | Sarah (Product Owner)                   | Validates stories and ensures artifacts are cohesive.          |
| `@debugger`           | Dexter (Root Cause Analyst)             | Diagnoses and proposes new solutions for persistent failures.  |
| `@refactorer`         | Rocco (Code Quality Specialist)         | Improves code quality and reduces technical debt.              |
| `@meta`               | Metis (System Auditor)                  | Analyzes system performance and proposes improvements.         |
| `@ux-expert`          | Sally (UX Expert)                       | Defines user experience and UI specifications.                 |

---

## Project Structure

```plaintext
.
├── .bmad-core/            # The "brain" of the AI agents. Installed locally.
│   ├── agents/            # Individual agent prompt definitions.
│   ├── agent-teams/       # Configurations for agent teams.
│   ├── checklists/        # QA and validation checklists.
│   ├── data/              # Knowledge bases and preferences.
│   ├── system_docs/       # The core "constitution" of the system.
│   ├── tasks/             # Definitions of reusable agent tasks.
│   ├── templates/         # Document templates (PRD, Architecture, etc.).
│   └── workflows/         # High-level process definitions.
├── docs/                  # Project-specific documentation (PRD, Architecture).
├── dist/                  # Pre-built bundles for use in Web UIs (optional).
├── tools/                 # Utilities for building and managing the system.
│   ├── builders/
│   ├── installer/
│   └── upgraders/
└── package.json           # Project dependencies and scripts.
```
