# Stigmergy System State Schema

This document defines the official schema for the `.ai/state.json` file. This file is the **sacred ledger** of the swarm's activity and the sole source of truth for project state.

## Root Object

- **`schema_version`** (String): The version of this schema. e.g., "3.0".
- **`project_name`** (String): The user-defined name of the project.
- **`goal`** (String): The initial high-level goal provided by the user via the IDE.
- **`project_status`** (Enum): The current high-level status of the project.
  - `NEEDS_BRIEFING`: Initial state after goal is set.
  - `AWAITING_APPROVAL_BRIEF`: The brief is drafted and needs user approval.
  - `NEEDS_PRD`: Brief approved, awaiting PRD.
  - `AWAITING_APPROVAL_PRD`: PRD is drafted and needs user approval.
  - `NEEDS_ARCHITECTURE`: PRD approved, awaiting architecture.
  - `AWAITING_APPROVAL_ARCHITECTURE`: Architecture is drafted, needs approval.
  - `NEEDS_BLUEPRINT`: Architecture approved, awaiting blueprint.
  - `AWAITING_APPROVAL_BLUEPRINT`: Blueprint is drafted, needs approval.
  - `READY_FOR_EXECUTION`: Blueprint is approved, swarm can begin building.
  - `EXECUTION_IN_PROGRESS`: Actively working on blueprint tasks.
  - `EXECUTION_HALTED`: A critical, unrecoverable error occurred.
  - `PROJECT_COMPLETE`: All manifest tasks are complete.
- **`project_manifest`** (Object): The master plan derived from the blueprint.
  - **`tasks`** (Array of Objects): A list of all project tasks.
    - `id` (String): A unique ID for the task, e.g., "T01".
    - `summary` (String): The summary of the task.
    - `agent` (String): The agent alias responsible for the task (e.g., "james").
    - `status` (Enum: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED").
    - `dependencies` (Array of Strings): A list of task IDs that must be completed first.
    - `failure_count` (Number): Tracks the number of consecutive failures for this task.
- **`history`** (Array of Objects): The **immutable ledger** of all system actions.
- **`issue_log`** (Array of Objects): A log of persistent failures requiring a Responder.
