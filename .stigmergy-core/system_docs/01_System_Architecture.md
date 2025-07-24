# Stigmergy System Architecture & Operations Manual (v2.0)

This document describes the high-level architecture and operational rules of the Stigmergy Autonomous AI Development System. This is a core part of the **System Constitution**.

## Core Concept: A Stateful, Conversational Workflow

The system operates as a persistent, stateful server controlled entirely by natural language chat from within a user's IDE. The engine can be started and stopped at will, and it will automatically resume its work from its last known state, which is recorded in `.ai/state.json`.

The project lifecycle proceeds through distinct phases, managed by the AI orchestrator (`@saul`).

1.  **Phase I: The Grand Blueprint (Fully Autonomous)**
    *   **Trigger:** The user issues a single `@system start...` command via chat.
    *   **Process:** The engine detects this is a new project. It performs a one-time, automatic indexing of the codebase into its Neo4j knowledge graph. Then, a chain of specialized Planner agents is dispatched to create a complete project plan, including the Brief, PRD, Architecture, and a story file for every single task.
    *   **User Interaction:** None after the initial command.

2.  **Phase II: The Go/No-Go Decision (Single User Interaction)**
    *   **Trigger:** The "Grand Blueprint" is 100% complete.
    *   **Process:** The system halts and the `@saul` agent notifies the user that the plan is ready for final review. The `project_status` is set to `AWAITING_EXECUTION_APPROVAL`.
    *   **User Interaction:** One natural language command to approve execution (e.g., `@saul The plan looks solid, proceed.`).

3.  **Phase III: Autonomous Execution (Fully Autonomous & Persistent)**
    *   **Trigger:** The user grants approval via chat.
    *   **Process:** The engine's status changes to `EXECUTION_IN_PROGRESS`, and it begins executing the plan task by task. This phase is fully uninterruptible by design.
    *   **User Interaction:** None, unless an agent requires a secret (e.g., an API key) not present in the `.env` file.

4.  **Phase IV: Pause & Resume (User-Controlled Persistence)**
    *   **Trigger:** The user stops the engine's process (`npm start`).
    *   **Process:** The current state is automatically preserved in `.ai/state.json`. When the user runs `npm start` again, the engine reads the state file, sees the `EXECUTION_IN_PROGRESS` status, and immediately resumes work on the current task without repeating any previous steps.

5.  **Phase V: Self-Improvement (Autonomous Background Task)**
    *   **Trigger:** The project is marked as complete.
    *   **Process:** The `@metis` agent is invoked in a non-blocking background process to analyze the entire project history and generate executable improvement proposals for the system's own core files.
    *   **User Interaction:** None.
