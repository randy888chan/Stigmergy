# Stigmergy System State Schema

This document defines the official schema for the `.ai/state.json` file. This file is the **sacred ledger** of the swarm's activity and the sole source of truth for project state.

## Root Object

- **`schema_version`** (String): The version of this schema. e.g., "3.2".
- **`project_name`** (String): The user-defined name of the project.
- **`goal`** (String): The initial high-level goal provided by the user via the IDE.
- **`project_status`** (Enum): The current high-level status of the project.
- **`status_before_pause`** (String | Null): Stores the project status when paused by a user.
  - `NEEDS_INITIALIZATION`: The default state before a project goal is provided.
  - `GRAND_BLUEPRINT_PHASE`: The system is autonomously running the initial planning agents (@pm, @design-architect, etc.).
  - `AWAITING_EXECUTION_APPROVAL`: The entire project plan is complete and paused, waiting for the user's single go/no-go command.
  - `EXECUTION_IN_PROGRESS`: The system is autonomously executing the coding tasks from the manifest.
  - `AWAITING_QA`: A coding task is complete, and the system is running the QA protocol to verify it.
  - `EXECUTION_FAILED`: A task failed verification or execution repeatedly, requiring intervention from the @debugger.
  - `PAUSED_BY_USER`: The user has explicitly paused the engine via an IDE command.
  - `PROJECT_COMPLETE`: All manifest tasks are complete and verified. The @metis agent is triggered for self-improvement analysis.
- **`project_manifest`** (Object): The master plan derived from the blueprint.
  - **`tasks`** (Array of Objects): A list of all project tasks.
    - `id` (String): A unique ID for the task, e.g., "T01".
    - `summary` (String): The summary of the task.
    - `agent` (String): The agent alias responsible for the task (e.g., "james").
    - `status` (Enum: "PENDING" | "IN_PROGRESS" | "AWAITING_QA" | "COMPLETED" | "FAILED").
    - `dependencies` (Array of Strings): A list of task IDs that must be completed first.
    - `failure_count` (Number): Tracks the number of consecutive failures for this task.
- **`history`** (Array of Objects): The **immutable ledger** of all system actions.
- **`issue_log`** (Array of Objects): A log of persistent failures requiring a Responder.
```
