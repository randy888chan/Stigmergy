# Stigmergy: The Autonomous AI Development Swarm

Stigmergy is a revolutionary framework for orchestrating a swarm of specialized AI agents to autonomously build software. It moves beyond simple scripting to a model of **true autonomous orchestration**, where a central intelligence plans, executes, and learns with minimal human intervention.

At its core, the system utilizes:

-   **Stigmergic Coordination:** Agents interact indirectly by leaving "digital pheromones" in a shared state file (`.ai/state.json`), enabling complex, coordinated behavior without direct communication.
-   **Unified Autonomous Cycle:** A single, intelligent orchestrator manages the entire project lifecycle—from planning and architecture to coding, verification, and self-improvement—within your IDE.
-   **AI-Verifiable Outcomes:** Progress is measured by concrete, programmatically-confirmable outputs, bringing mathematical rigor and transparency to project tracking.
-   **Constitutional AI:** All agents operate under a shared set of core principles (`.stigmergy-core/system_docs/03_Core_Principles.md`), ensuring consistent, predictable, and safe behavior.

## 🚀 Installation & Upgrade

### One-Time Authentication Setup
Because Stigmergy is distributed via the GitHub Package Registry, you must first authenticate your local machine. You only need to do this once.

1.  Create a [GitHub Personal Access Token (Classic)](https://github.com/settings/tokens/new) with the `read:packages` scope.
2.  Log in to the GitHub NPM registry by running the following command and pasting your token when prompted for a password:
    ```bash
    npm login --scope=@randy888chan --registry=https://npm.pkg.github.com
    ```
    (Use your GitHub username for the username prompt).

### For New Projects
Install the Stigmergy framework into your project directory.
```bash
# Run this command in the root of your new project folder
npx @randy888chan/stigmergy install
```

### For Existing Projects
An interactive upgrader is available to transition your project to the new architecture.
```bash
# From your existing project's root directory
npx @randy888chan/stigmergy upgrade
```

---
## The Stigmergy Cycle: The Path to Autonomy

1.  **Initiation:** In your IDE, activate the Chief Orchestrator, **`@stigmergy-master` (Saul)**.
2.  **Directive:** Give Saul a high-level project goal.
    > "We need to build a new application. A project brief is located at `docs/brief.md`. Please begin the project."
3.  **Autonomous Orchestration:** Saul will now initiate the Stigmergy Cycle, managing planning, execution, verification, and adaptation autonomously until the project is complete. This is a hands-free process. Saul will dispatch specialist agents as needed without requiring your intervention.

---

## Agent Archetypes

The swarm is composed of specialized agents, each with a clear role, operating under a strict chain of command dispatched by the Chief Orchestrator.

| Agent ID                  | Name (Archetype)                     | Core Responsibilities                                                               |
| ------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------- |
| **`@stigmergy-master`**   | **Saul (Chief Orchestrator)**        | The master brain. Interprets user goals and the system state to direct the swarm. |
| `@pm`, `@architect`       | **(Planners)** John, Winston         | Create the project blueprint (`docs/`) under Saul's direction.                      |
| `@sm`                     | **(Executor)** Bob                   | Task Decomposer. Breaks down epics from the blueprint into actionable stories.      |
| **`@stigmergy-orchestrator`** | **(Executor)** Olivia                | Execution Coordinator. Manages the `dev->qa->po` loop for a single story.         |
| `@dev`, `@victor`         | **(Executors)** James, Victor        | Write code and implement stories.                                                   |
| `@qa`, `@po`              | **(Verifiers)** Quinn, Sarah         | Ensure quality, standards compliance, and alignment with the blueprint.           |
| `@debugger`               | **(Adaptive Responder)** Dexter      | Diagnoses complex failures recorded in the state log.                               |
| `@meta`                   | **(Adaptive Responder)** Metis       | Analyzes swarm performance to make the system itself better.                        |

---

## Project Structure

```plaintext
.
├── .stigmergy-core/   # The "brain" of the AI agents. Installed locally.
│   ├── agents/        # Individual agent prompt definitions.
│   └── system_docs/   # The core "constitution" of the system.
├── .ai/               # The dynamic "memory" of the swarm (gitignore this).
│   └── state.json     # The shared state file driving agent coordination.
├── docs/              # The project-specific "blueprint" (PRD, Architecture).
│   ├── architecture/  # Detailed, verifiable architecture documents.
│   └── stories/       # AI-generated, self-contained story files.
└── src/               # The source code of the application being built.
```
