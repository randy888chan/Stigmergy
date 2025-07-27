# Stigmergy System Architecture & Operations Manual (v1.5 - Operational)

This document describes the high-level architecture and operational rules of the Stigmergy Autonomous AI Development System. This is a core part of the **System Constitution**.

## Core Concept: A Chat-Controlled State Machine

The system operates as a persistent, stateful server controlled entirely by natural language chat from within a user's IDE. The engine's core logic is a **state machine** that reads the `project_status` from `.ai/state.json` and executes the appropriate actions for that state.

The engine can be started (`npm run stigmergy:start`) and left running. All project lifecycle actions—starting, pausing, and resuming—are handled via IDE chat commands. The system automatically saves its state, allowing the `stigmergy:start` process to be stopped and restarted at any time, resuming work exactly where it left off.

### The Project Lifecycle States

1.  **`NEEDS_INITIALIZATION`** (Dormant State)
    *   **Description:** The engine is idle, awaiting a new project.
    *   **Trigger:** The user issues a `@system-start` command with a project goal.
    *   **Transition:** State becomes `GRAND_BLUEPRINT_PHASE`.

2.  **`GRAND_BLUEPRINT_PHASE`** (Autonomous Planning)
    *   **Description:** A sequence of planning agents (`@analyst`, `@pm`, `@design-architect`) run autonomously to create all project documentation, stories, and the execution manifest.
    *   **Trigger:** Automatic transition from the previous state.
    *   **Transition:** On completion, the state becomes `AWAITING_EXECUTION_APPROVAL`.

3.  **`AWAITING_EXECUTION_APPROVAL`** (User Approval Gate)
    *   **Description:** The system pauses. This is the **single go/no-go decision point** for the user. The `@dispatcher` agent notifies the user that the plan is ready for review.
    *   **Trigger:** The user gives consent in natural language to the `@dispatcher`.
    *   **Transition:** State becomes `EXECUTION_IN_PROGRESS`.

4.  **`EXECUTION_IN_PROGRESS`** (Autonomous Execution)
    *   **Description:** The engine iterates through the `project_manifest`, dispatching the configured executor agent (`@gemini-executor` or `@dev`) to complete each task.
    *   **Trigger:** Automatic transition from the previous state.
    *   **Transition:** After each task is completed, the state becomes `AWAITING_QA`.

5.  **`AWAITING_QA`** (Autonomous Verification)
    *   **Description:** The `@qa` agent is dispatched to run the automated tests and quality checks defined in the `qa-protocol.md`.
    *   **Trigger:** Automatic transition from the previous state.
    *   **Transition:**
        *   On success, state returns to `EXECUTION_IN_PROGRESS` to start the next task.
        *   On failure, state becomes `EXECUTION_FAILED`.

6.  **`PAUSED_BY_USER`** (User-Controlled Pause)
    *   **Description:** The engine loop is halted. No further actions will be taken until resumed.
    *   **Trigger:** The user issues a `@system-pause` command from the IDE.
    *   **Transition:** The user must issue a `@system-resume` command to return the system to its previous state.

7.  **`PROJECT_COMPLETE`** (Terminal State & Self-Improvement)
    *   **Description:** All tasks in the manifest are completed and verified.
    *   **Trigger:** The last task successfully passes the `AWAITING_QA` state.
    *   **Action:** The `@metis` agent is invoked as a non-blocking background process to analyze the project history and propose system improvements. The engine becomes dormant.
