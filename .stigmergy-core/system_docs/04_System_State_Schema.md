# Stigmergy System State Schema

This document defines the official, versioned schema for the `.ai/state.json` file. This is the central nervous system of the swarm and a part of the System Constitution. All agents that read from or write to the state file MUST adhere to this structure.

**Version:** 2.0

## Root Object Structure

```json
{
  "schema_version": "2.0",
  "project_name": "string",
  "autonomy_mode": "supervised | autonomous",
  "project_status": "string (See Project Status Enum)",
  "system_signal": "string (See System Signal Enum)",
  "project_manifest": {
    "epics": [
      {
        "epic_id": "string",
        "title": "string",
        "status": "PENDING | IN_PROGRESS | COMPLETE",
        "stories": [
          { 
            "story_id": "string", 
            "title": "string", 
            "status": "PENDING | APPROVED | IN_PROGRESS | QA_PENDING | PO_PENDING | DONE" 
          }
        ]
      }
    ]
  },
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

### `autonomy_mode` (Enum)
Determines the level of human intervention required. Can be set by the user.
- `supervised`: (Default) The system will pause and await user approval at key checkpoints (e.g., after blueprint creation).
- `autonomous`: The system will proceed through the entire project lifecycle without stopping, including the self-improvement loop.

### `project_manifest`
The master plan for the entire project, populated by the `@pm` agent after the PRD is created. This provides foresight and a clear roadmap for the swarm and the user.

### `project_status` (Enum)
The high-level strategic phase of the project.
- `NEEDS_BRIEFING`: Initial state. Awaiting Project Brief creation.
- `NEEDS_PLANNING`: Brief complete. Awaiting PRD/Architecture.
- `PLANNING_IN_PROGRESS`: `@pm` or `@architect` are working.
- `READY_FOR_EXECUTION`: Blueprint is complete and manifest is populated.
- `EXECUTION_IN_PROGRESS`: Stories are actively being worked on by `@stigmergy-orchestrator`.
- `SYSTEM_AUDIT_PENDING`: An epic is complete; `@meta` is being dispatched.
- `HUMAN_INPUT_REQUIRED`: The swarm is blocked and requires user intervention.
- `PROJECT_COMPLETE`: All epics are implemented and verified.
