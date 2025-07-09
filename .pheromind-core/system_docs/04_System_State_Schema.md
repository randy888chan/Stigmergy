# Pheromind System State Schema
# Defines the structure for `.ai/state.json`. All agents MUST adhere to this schema.
# Version: 2.0

{
  "schema_version": "2.0",
  "project_name": "string",
  "autonomy_mode": "supervised | autonomous",
  "project_status": "NEEDS_BRIEFING | NEEDS_PLANNING | READY_FOR_EXECUTION | EXECUTION_IN_PROGRESS | HUMAN_INPUT_REQUIRED | PROJECT_COMPLETE",
  "system_signal": "string | null (The 'digital pheromone' left by the last agent)",
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
            "status": "PENDING | CODING_IN_PROGRESS | CODING_COMPLETE | QA_PASSED | PO_VERIFIED | DONE | FAILED"
          }
        ]
      }
    ]
  },
  "history": [
    {
      "timestamp": "ISO 8601 string",
      "agent_id": "string",
      "signal": "string | null",
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
      "details": "string (Can include log snippets)"
    }
  ]
}
