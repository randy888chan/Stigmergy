# Pheromind System Architecture & Operations Manual

This document describes the high-level architecture and immutable operational rules of the Pheromind Autonomous AI Development System. This is a core part of the **System Constitution**. All agents must operate within this framework.

## Core Directories

The system uses three key directories:

1.  **`.bmad-core/` (The Swarm's Brain):** Contains the core logic: agent definitions, tasks, and the System Constitution.
2.  **`docs/` (The Immutable Project Blueprint):** Contains the project-specific requirements (`prd.md`) and technical plans (`architecture.md`). This is the **read-only source of truth** during execution.
3.  **`.ai/` (The Swarm's Memory & Scent Trail):** The dynamic workspace. It contains the shared state file (`state.json`), logs, and reports. This directory is the medium for stigmergic communication. It MUST be in `.gitignore`.

## The Pheromind Cycle: A Unified Autonomous Loop

The system operates on a single, continuous work cycle driven by the **Chief Orchestrator & System Interpreter (`@bmad-master`, Saul)**. This cycle transforms high-level goals into completed software.

### System States

The entire project operates based on a `project_status` within `.ai/state.json`. Key states include:

- `NEEDS_PLANNING`: A goal has been set, but a project blueprint (`docs/`) does not exist or is incomplete.
- `READY_FOR_EXECUTION`: The blueprint is complete, and the swarm is ready to implement stories.
- `STORY_IN_PROGRESS`: An execution-coordinator is managing the implementation of a story.
- `FAILURE_DETECTED`: A task has failed and requires intervention from a specialist like the `@debugger`.
- `PROJECT_COMPLETE`: All epics in the blueprint have been implemented and verified.

### The Unified Workflow

The loop is no longer a simple, rigid chain. It is a strategic, state-driven cycle managed by `@bmad-master`.

**1. State Interpretation (Saul):**
*   **Input:** Reads the `.ai/state.json` file to understand the current `project_status` and `system_signal`.
*   **Action:** Acts as the **System Interpreter**, translating narrative reports from other agents into the next verifiable system state.

**2. Strategic Dispatch (Saul):**
*   **Action:** Based on the interpreted state, acts as the **Chief Orchestrator**, dispatching the correct agent for the job. This is not a fixed sequence but a strategic decision (e.g., dispatching `@pm` for planning, `@sm` for story creation, `@bmad-orchestrator` for execution, `@debugger` for failure analysis).

**3. Specialized Execution (Worker Agents):**
*   **Input:** A specialized agent (e.g., `@dev`, `@pm`, `@qa`) receives a single, specific task from its dispatcher.
*   **Action:** The worker executes its task, referencing the `docs/` blueprint for context and adhering to its own core protocols and the System Constitution.
*   **Output:** The worker produces a structured narrative report of its outcome and concludes with a **mandatory handoff to `@bmad-master`**, the System Interpreter. This action leaves the "digital pheromone" that guides the next step of the cycle.

This unified architecture ensures that all system activity is coordinated through a central intelligence, enabling true autonomous orchestration and adaptive responses.
