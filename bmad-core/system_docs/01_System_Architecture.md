# Stigmergy System Architecture & Operations Manual

This document describes the high-level architecture and immutable operational rules of the Stigmergy Autonomous AI Development System. This is a core part of the **System Constitution**. All agents must operate within this framework.

## Core Concepts & Directories

The system uses three key directories to manage the separation of concerns:

1.  **`.stigmergy-core/` (The Swarm's Brain):** Contains the core logic: agent definitions, tasks, and the System Constitution.
2.  **`docs/` (The Immutable Project Blueprint):** This is the project-specific source of truth, containing requirements (`prd.md`) and technical plans (`architecture.md`). **CRITICAL: This directory is considered read-only during the execution phase.** Agents refer to it for guidance but are forbidden from altering it after the planning phase is complete.
3.  **`.ai/` (The Swarm's Memory & Scent Trail):** The dynamic workspace for stigmergic communication. It contains the shared state file (`state.json`), logs, and reports. It MUST be in `.gitignore`.
4.  **`src/` (The Ephemeral Workspace):** The active development directory where code is written, modified, and deleted by executor agents.

## The Stigmergy Cycle: A State-Driven Autonomous Loop

The system operates on a single, continuous work cycle driven by the **Chief Orchestrator & System Interpreter (`@stigmergy-master`, Saul)**. This cycle transforms high-level goals into completed software by reacting to the system's state, not a rigid script.

### System States & Signals

The entire project operates based on two key fields within `.ai/state.json`, which has a strict schema defined in `04_System_State_Schema.md`:

-   `project_status`: The high-level strategic phase of the project (e.g., `NEEDS_PLANNING`, `READY_FOR_EXECUTION`).
-   `system_signal`: A specific "digital pheromone" left by the last agent, indicating a precise event has occurred (e.g., `STORY_APPROVED`, `FAILURE_DETECTED`).

### The Unified Workflow

The loop is a strategic, state-driven cycle managed exclusively by `@stigmergy-master`.

1.  **State Interpretation (Saul):**
    *   **Input:** Reads the `.ai/state.json` file to understand the current `project_status` and `system_signal`.
    *   **Action:** Acts as the **System Interpreter**, translating narrative reports from other agents and external events into the next verifiable system state by *appending* to the state log.

2.  **Strategic Dispatch (Saul):**
    *   **Action:** Based on the interpreted state, acts as the **Chief Orchestrator**, dispatching the correct specialist agent or sub-orchestrator for the current phase of the project, following the `STIGMERGY_PROTOCOL` defined in his agent file.

3.  **Coordinated Execution (Olivia & Workers):**
    *   **Input:** For development tasks, the **Execution Coordinator (`@stigmergy-orchestrator`, Olivia)** receives a single story from Saul.
    *   **Action:** Olivia analyzes and decomposes the story's tasks into smaller, verifiable sub-tasks. She then manages a tight `dev -> qa -> po` loop for each sub-task, dispatching specialized `Executors` and `Verifiers`.
    *   **Output:** Upon completion of all sub-tasks, Olivia compiles a final report and hands control back to Saul with a clear `system_signal`. This leaves the "digital pheromone" that guides the next step of the autonomous cycle.
