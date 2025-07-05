# Pheromind: The Autonomous AI Development Swarm

Pheromind is a revolutionary framework for orchestrating a swarm of specialized AI agents to autonomously build software. It moves beyond simple scripting to a model of **true autonomous orchestration**, where a central intelligence plans, executes, and learns with minimal human intervention.

At its core, the system utilizes:

- **Stigmergic Coordination:** Agents interact indirectly by leaving "digital pheromones" in a shared state file (`.ai/state.json`), enabling complex, coordinated behavior without direct communication.
- **Unified Autonomous Cycle:** A single, intelligent orchestrator manages the entire project lifecycle—from planning and architecture to coding, verification, and self-improvement—within your IDE.
- **AI-Verifiable Outcomes:** Progress is measured by concrete, programmatically-confirmable outputs, bringing mathematical rigor and transparency to project tracking.
- **Constitutional AI:** All agents operate under a shared set of core principles (`bmad-core/system_docs/03_Core_Principles.md`), ensuring consistent, predictable, and safe behavior.

## 🚀 Installation & Upgrade

### One-Time Authentication Setup
Because Pheromind is distributed via the GitHub Package Registry, you must first authenticate your local machine. You only need to do this once.

1.  Create a [GitHub Personal Access Token (Classic)](https://github.com/settings/tokens/new) with the `read:packages` scope.
2.  Log in to the GitHub NPM registry by running the following command and pasting your token when prompted for a password:
    ```bash
    npm login --scope=@randy888chan --registry=https://npm.pkg.github.com
    ```
    (Use your GitHub username for the username prompt).

### For New Projects
Install the Pheromind framework into your project directory.
```bash
# Run this command in the root of your new project folder
npx @randy888chan/pheromind install


For Existing V3 Projects
An interactive upgrader is available to transition your project to the new architecture.
Generated bash
# From your existing project's root directory
npx @randy888chan/pheromind upgrade
Use code with caution.
Bash


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

Of course. The board has convened, reviewed the repository and the state of the Pheromind initiative, and produced the following strategic audit and architectural evolution plan.

## Agent Archetypes

The swarm is composed of specialized agents, each with a clear role.

| Agent ID              | Name (Archetype)                     | Core Responsibilities                                          |
| --------------------- | ------------------------------------ | -------------------------------------------------------------- |
| **`@bmad-master`**      | **Saul (Chief Orchestrator)**        | The master brain. Manages the entire lifecycle. Interprets all reports and dispatches all tasks. |
| `@pm`, `@architect`   | (Planners)                           | Create the project blueprint (`docs/`) under Saul's direction. |
| `@sm`                 | Bob (Task Decomposer)                | Breaks down epics from the blueprint into actionable stories. |
| **`@bmad-orchestrator`** | **Olivia (Execution Coordinator)**   | A sub-orchestrator, dispatched by Saul to manage the `dev->qa->po` loop for a single story. |
| `@dev`, `@victor`     | (Executors)                          | Write code and implement stories.                              |
| `@qa`, `@po`          | (Verifiers)                          | Ensure quality, standards compliance, and alignment with the blueprint. |
| `@debugger`           | Dexter (Adaptive Responder)          | Diagnoses complex failures and proposes new paths forward.     |
| `@meta`               | Metis (System Auditor)               | Analyzes swarm performance to make the system itself better.   |

---

## Project Structure

```plaintext
.
├── .bmad-core/        # The "brain" of the AI agents. Installed locally.
│   ├── agents/        # Individual agent prompt definitions.
│   └── system_docs/   # The core "constitution" of the system.
├── .ai/               # The dynamic "memory" of the swarm (gitignore this).
│   └── state.json     # The shared state file driving agent coordination.
├── docs/              # The project-specific "blueprint" (PRD, Architecture).
│   ├── architecture/  # Detailed, verifiable architecture documents.
│   └── stories/       # AI-generated, self-contained story files.
└── src/               # The source code of the application being built.
```
