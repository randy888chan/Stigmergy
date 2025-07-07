# Stigmergy System State Schema

This document defines the official, versioned schema for the `.ai/state.json` file. This is the central nervous system of the swarm and a part of the System Constitution. All agents that read from or write to the state file MUST adhere to this structure.

**Version:** 1.0

## Root Object Structure

```json
{
  "schema_version": "1.0",
  "project_name": "string",
  "project_status": "string (See Project Status Enum)",
  "system_signal": "string (See System Signal Enum)",
  "current_epic": "string | null",
  "history": [
    {
      "timestamp": "ISO 8601 string",
      "agent_id": "string",
      "signal": "string",
      "summary": "string"
    }
  ],
  "agent_reports": {
    "string": "string"
  },
  "issue_log": [
    {
      "issue_id": "string",
      "status": "OPEN | RESOLVED | CLOSED",
      "reporter_agent": "string",
      "description": "string",
      "history": "array"
    }
  ]
}
```

## Key Fields

### `project_status` (Enum)

Defines the overall strategic phase of the project.

- `NEEDS_PLANNING`: Initial state. Awaiting Project Blueprint.
- `PLANNING_IN_PROGRESS`: `@pm` or `@architect` are working.
- `READY_FOR_EXECUTION`: Blueprint is complete. Ready for story creation/implementation.
- `EXECUTION_IN_PROGRESS`: Stories are actively being worked on by `@stigmergy-orchestrator`.
- `SYSTEM_AUDIT_PENDING`: An epic is complete; `@meta` is being dispatched.
- `HUMAN_INPUT_REQUIRED`: The swarm is blocked and requires user intervention.
- `PROJECT_COMPLETE`: All epics are implemented and verified.

### `system_signal` (Enum)

The specific event or "pheromone" left by the last agent, which triggers the next action.

- `PROJECT_INITIATED`: New project started.
- `BLUEPRINT_COMPLETE`: Planning phase (`docs/`) is done.
- `INGESTION_COMPLETE`: External docs have been processed.
- `STORY_CREATED`: `@sm` created a new story file.
- `STORY_APPROVED`: User/PO has approved a story.
- `STORY_IMPLEMENTATION_SUCCESS`: `@dev` has completed coding for a sub-task.
- `STORY_QA_PASSED`: `@qa` has verified the code for a sub-task.
- `STORY_VERIFIED_BY_PO`: `@po` has approved the final artifact for a story.
- `EPIC_COMPLETE`: The final story of an epic has been verified.
- `FAILURE_DETECTED`: A task failed verification.
- `ESCALATION_REQUIRED`: A task has failed repeatedly and is logged in `issue_log`.
- `SYSTEM_AUDIT_COMPLETE`: `@meta` has finished its performance review.

### `history`

An **append-only**, immutable log of all major state changes, providing a complete audit trail of the swarm's activity. The primary source of truth for "what happened."

### `agent_reports`

A key-value store where the detailed markdown reports from agents are stored for auditing. The key should be a unique identifier like `{timestamp}-{agent_id}`. This keeps the primary `history` log concise.

### `issue_log`

A structured log for tracking persistent failures that require specialist intervention from `@debugger`.
