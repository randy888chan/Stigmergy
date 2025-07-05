# Pheromind: The Autonomous AI Development Swarm

Pheromind is a revolutionary framework for orchestrating a swarm of specialized AI agents to autonomously build software. It moves beyond simple scripting to a model of **true autonomous orchestration**, where a central intelligence plans, executes, and learns with minimal human intervention.

At its core, the system utilizes:

- **Stigmergic Coordination:** Agents interact indirectly by leaving "digital pheromones" in a shared state file (`.ai/state.json`), enabling complex, coordinated behavior without direct communication.
- **Unified Autonomous Cycle:** A single, intelligent orchestrator manages the entire project lifecycle—from planning and architecture to coding, verification, and self-improvement—within your IDE.
- **AI-Verifiable Outcomes:** Progress is measured by concrete, programmatically-confirmable outputs, bringing mathematical rigor and transparency to project tracking.
- **Constitutional AI:** All agents operate under a shared set of core principles (`bmad-core/system_docs/03_Core_Principles.md`), ensuring consistent, predictable, and safe behavior.

---

## 🚀 Installation & Upgrade

**For New Projects:**
The Pheromind framework includes an interactive installer that configures your project.
```bash
# Run this command in the root of your new project folder
npx @randy888chan/stigmergy install
```

**For Existing V3 Projects:**
An interactive upgrader is available to transition your project to the new architecture.
```bash
# From your existing project's root directory
npx @randy888chan/stigmergy upgrade
```

---

## The Pheromind Cycle: Two Paths to Autonomy

Pheromind offers a flexible workflow. You can start planning directly in your IDE or leverage a Web UI for initial research and then seamlessly ingest the results.

### Path 1: IDE-First Workflow (Recommended)

This is the most direct path to autonomous development.

1.  **Initiation:** In your IDE, activate the Chief Orchestrator, **`@bmad-master` (Saul)**.
2.  **Directive:** Give Saul a high-level project goal.
    > "We need to build a new application. A project brief is located at `docs/brief.md`. Please begin the project."
3.  **Autonomous Orchestration:** Saul will now initiate the Pheromind Cycle, managing planning, execution, verification, and adaptation autonomously until the project is complete.

### Path 2: Web-to-IDE Ingestion Workflow (Optional)

This path is ideal for cost-effective initial planning using the web research capabilities of models like Gemini.

1.  **Phase 1: Web UI Planning.** Use a tool like Gemini with the `team-planning-crew.txt` bundle to perform research and generate your initial `prd.md` and `architecture.md`. Save these files to your local `docs/` folder.
2.  **Phase 2: IDE Ingestion.** In your IDE, activate the Chief Orchestrator, **`@bmad-master` (Saul)**.
3.  **Directive:** Instruct Saul to ingest the externally created documents.
    > `*ingest_docs`
4.  **Autonomous Integration:** Saul will automatically process, shard, and integrate these documents into the swarm's memory. Once complete, he will signal that the project is `READY_FOR_EXECUTION`, and the autonomous Pheromind Cycle will begin.

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

