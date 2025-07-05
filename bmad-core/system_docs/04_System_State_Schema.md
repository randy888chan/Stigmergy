# Pheromind System State Schema

This document defines the official schema for the `.ai/state.json` file. This is the central nervous system of the swarm and a part of the System Constitution. All agents that read from or write to the state file MUST adhere to this structure.

## Root Object Structure

```json
{
  "project_name": "string",
  "project_status": "string (See Project Status Enum)",
  "system_signal": "string (See System Signal Enum)",
  "current_epic": "integer | null",
  "history": [
    {
      "timestamp": "ISO 8601 string",
      "agent_id": "string",
      "signal": "string",
      "summary": "string"
    }
  ],
  "agent_reports": "object"
}
```

## Key Fields

### `project_status` (Enum)
Defines the overall strategic phase of the project.
- `NEEDS_PLANNING`: Initial state. Awaiting Project Blueprint.
- `PLANNING_IN_PROGRESS`: `@pm` or `@architect` are working.
- `READY_FOR_EXECUTION`: Blueprint is complete. Ready for story creation/implementation.
- `EXECUTION_IN_PROGRESS`: Stories are actively being worked on.
- `PERFORMANCE_AUDIT_PENDING`: An epic is complete; `@meta` is being dispatched.
- `HUMAN_INPUT_REQUIRED`: The swarm is blocked and requires user intervention.
- `PROJECT_COMPLETE`: All epics are implemented and verified.

### `system_signal` (Enum)
The specific event or "pheromone" left by the last agent, which triggers the next action.
- `PROJECT_INITIATED`: New project started.
- `INGESTION_COMPLETE`: External docs have been processed.
- `STORY_CREATED`: `@sm` created a new story file.
- `STORY_APPROVED_FOR_EXECUTION`: User/PO has approved a story.
- `STORY_IMPLEMENTATION_SUCCESS`: `@dev` has completed coding.
- `CODE_APPROVED_BY_QA`: `@qa` has verified the code.
- `STORY_VERIFIED_BY_PO`: `@po` has approved the final artifact.
- `EPIC_COMPLETE`: The final story of an epic has been verified.
- `FAILURE_DETECTED`: A task failed verification.
- `ESCALATION_REQUIRED`: A task has failed repeatedly.

### `history`
An immutable log of all major state changes, providing a complete audit trail of the swarm's activity.

### `agent_reports`
A key-value store where the detailed markdown reports from agents are stored for auditing purposes. The key should be a unique identifier like `{timestamp}-{agent_id}`.
