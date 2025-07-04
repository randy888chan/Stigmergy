# Stigmergy System Architecture & Operations Manual

This document describes the high-level architecture and immutable operational rules of the Stigmergy Autonomous AI Development System. This is a core part of the **System Constitution**.

## Core Directories

The system operates using three distinct directory structures:

1.  **`.bmad-core/` (The Swarm's Brain):** This contains the core logic of the system: agent definitions, tasks, templates, and the System Constitution itself. It is installed once and treated as part of the application's source code.
2.  **`docs/` (The Immutable Project Blueprint):** This directory contains the specific requirements (`prd.md`) and technical plans (`architecture.md`) for the software being built. Once Phase 1 (Planning) is complete, this directory becomes the **read-only source of truth**. Worker agents may *read* from it for context but are forbidden from *modifying* its contents.
3.  **`.ai/` (The Swarm's Memory):** This is the dynamic, operational workspace of the swarm. It contains the shared state file (`state.json`), logs, and reports. This directory is created at runtime and MUST be included in `.gitignore`.

## The Autonomous Loop

The system operates on a self-perpetuating work cycle driven by the shared state file. This `Orchestrator -> Worker -> Scribe` cycle is the heartbeat of the swarm.

**Shared State File:** The central medium for communication is **`.ai/state.json`**. Agents interact indirectly by reading from and reporting back to the agents who write to this file. This process is called stigmergy.

The loop proceeds in three mandatory steps:

**1. Orchestration (`@bmad-orchestrator`, Olivia):**
*   **Input:** Reads the `.ai/state.json` file.
*   **Action:** Analyzes the `system_signals` to determine the next task according to its dispatch protocol. Dispatches the task to a specialist worker agent.
*   **Output:** Her turn ends immediately after dispatching the worker.

**2. Execution (A Worker Agent, e.g., `@dev`, `@sm`):**
*   **Input:** Receives a single, specific task from the Orchestrator.
*   **Action:** Executes the task, consulting the Project Blueprint (`docs/`) for context and adhering to the System Constitution (`system_docs/`).
*   **Output:** Produces a structured report detailing the outcome and concludes with a **mandatory handoff to the Scribe**.

**3. State Update (`@bmad-master`, Saul):**
*   **Input:** Receives the report from a worker agent.
*   **Action:** Parses the report, translates the outcome into structured data, and generates a new system signal.
*   **Output:** Updates `.ai/state.json` with the report and the new signal, then concludes with a **mandatory handoff back to the Orchestrator**, thus completing the loop.
