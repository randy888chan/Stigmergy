# Stigmergy: The Autonomous AI Development Swarm

Stigmergy is a revolutionary framework for orchestrating a swarm of specialized AI agents to autonomously build software. It moves beyond simple scripting to a model of **true autonomous orchestration**, where a central intelligence plans, executes, and learns with minimal human intervention.

At its core, the system utilizes:

-   **Stigmergic Coordination:** Agents interact indirectly by leaving "digital pheromones" in a shared state file (`.ai/state.json`), enabling complex, coordinated behavior without direct communication.
-   **Unified Autonomous Cycle:** A single, intelligent orchestrator manages the entire project lifecycle—from planning and architecture to coding, verification, and self-improvement—within your IDE.
-   **AI-Verifiable Outcomes:** Progress is measured by concrete, programmatically-confirmable outputs against a master project manifest.
-   **Constitutional AI:** All agents operate under a shared set of core principles (`.stigmergy-core/system_docs/03_Core_Principles.md`), ensuring consistent, predictable, and trustworthy behavior.

## 🚀 Installation

```bash
# Run this command in the root of your project folder
npx @randy888chan/stigmergy install
```

---
## The Stigmergy Cycle: The Path to Autonomy

1.  **Initiation:** In your IDE, activate the Chief Orchestrator, **`@stigmergy-master` (Saul)**.
2.  **Directive:** Give Saul a high-level project goal in a simple text file (e.g., `goal.txt`).
    > `"Our goal is to build a simple Next.js application with a single page. Deployment target is Vercel."`
3.  **Set Autonomy:** For a hands-free experience, give Saul the command:
    > `*set_autonomy autonomous`
4.  **Begin:**
    > `*begin_project goal.txt`
5.  **Autonomous Orchestration:** Saul will now initiate the full Stigmergy Cycle. He will dispatch planners to create a detailed blueprint, populate a master project manifest in `state.json`, and then manage the entire execution and self-improvement loop without further intervention.

---

## Agent Archetypes

The swarm is composed of specialized agents, each with a clear role, operating under a strict chain of command dispatched by the Chief Orchestrator.

| Agent ID                  | Name (Archetype)                     | Core Responsibilities                                                               |
| ------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------- |
| **`@stigmergy-master`**   | **Saul (Chief Orchestrator)**        | The master brain. Interprets goals and directs the swarm through the entire lifecycle. |
| `@analyst`, `@pm`, `@architect` | **(Planners)** Mary, John, Winston | Create the project blueprint (`docs/`) under Saul's direction, adhering to all user constraints. |
| **`@stigmergy-orchestrator`** | **(Executor)** Olivia                | Execution Coordinator. Manages the micro-level `dev->qa->po` loop for a single story. |
| `@dev`, `@victor`         | **(Executors)** James, Victor        | Write code to implement sub-tasks assigned by Olivia.                               |
| `@qa`, `@po`              | **(Verifiers)** Quinn, Sarah         | Ensure quality, standards compliance, and alignment with the blueprint.           |
| `@debugger`               | **(Adaptive Responder)** Dexter      | Diagnoses and proposes solutions for complex failures logged in the state file.       |
| `@meta`                   | **(Adaptive Responder)** Metis       | Analyzes swarm performance and proposes concrete improvements to the system itself. |

---

## Project Structure

```plaintext
.
├── .stigmergy-core/   # The "brain" of the AI agents. Installed locally.
│   ├── agents/        # Individual agent prompt definitions.
│   └── system_docs/   # The core "constitution" of the system.
├── .ai/               # The dynamic "memory" of the swarm (gitignore this).
│   └── state.json     # The master project manifest and state file.
├── docs/              # The project-specific "blueprint" (PRD, Architecture).
└── src/               # The source code of the application being built.
```
