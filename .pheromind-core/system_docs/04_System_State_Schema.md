# Pheromind System State Schema

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
            "status": "PENDING | APPROVED | IN_PROGRESS | QA_PENDING | PO_PENDING | DONE | FAILED"
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
      "summary": "string",
      "files_modified": ["string"]
    }
  ],
  "issue_log": [
    {
      "issue_id": "string",
      "timestamp": "ISO 8601 string",
      "status": "OPEN | RESOLVED | CLOSED",
      "reporter_agent": "string",
      "story_id": "string",
      "summary": "string",
      "details": "string (Can include log snippets)",
      "resolution_strategy": "string (Proposed by @debugger)"
    }
  ],
  "system_improvement_proposals": [
    {
      "proposal_id": "string",
      "timestamp": "ISO 8601 string",
      "status": "PENDING_APPROVAL | APPROVED | IMPLEMENTED | REJECTED",
      "proposer_agent": "meta",
      "summary": "string",
      "proposal_file_path": "string (e.g., .ai/proposals/proposal-001.yml)"
    }
  ]
}
```

---

## Enumerations

### `autonomy_mode` (Enum)

Determines the level of human intervention required.

- `supervised`: (Default) The system will pause and await user approval at key checkpoints.
- `autonomous`: The system will proceed through the entire project lifecycle without stopping.

### `project_status` (Enum)

The high-level strategic phase of the project.

- `NEEDS_BRIEFING`: Initial state. Awaiting Project Brief creation.
- `NEEDS_PLANNING`: Brief complete. Awaiting PRD/Architecture and Manifest.
- `READY_FOR_EXECUTION`: Blueprint and manifest are complete.
- `EXECUTION_IN_PROGRESS`: Stories are actively being worked on.
- `EPIC_COMPLETE`: An epic has been fully implemented, awaiting system audit.
- `HUMAN_INPUT_REQUIRED`: The swarm is blocked and requires user intervention.
- `PROJECT_COMPLETE`: All epics in the manifest are implemented and verified.

### `system_signal` (Enum)

The "digital pheromone" left by the last agent to trigger the next action.

- `BRIEF_COMPLETE`
- `BLUEPRINT_COMPLETE`
- `STORY_CREATED`
- `STORY_APPROVED`
- `STORY_VERIFIED_BY_PO`
- `EPIC_COMPLETE`
- `FAILURE_DETECTED`
- `ESCALATION_REQUIRED`
- `SYSTEM_AUDIT_COMPLETE`
- `PROPOSAL_IMPLEMENTED`

```

```
