--- START OF FILE `.pheromind-core/system_docs/04_System_State_Schema.json` ---
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Pheromind System State",
  "description": "Defines the structure for the .ai/state.json file. All agents MUST adhere to this schema.",
  "type": "object",
  "required": [
    "schema_version",
    "project_name",
    "autonomy_mode",
    "project_status",
    "system_signal",
    "project_manifest",
    "history",
    "issue_log"
  ],
  "properties": {
    "schema_version": {
      "type": "string",
      "const": "2.0"
    },
    "project_name": {
      "type": "string"
    },
    "autonomy_mode": {
      "type": "string",
      "enum": ["supervised", "autonomous"]
    },
    "project_status": {
      "type": "string",
      "enum": [
        "NEEDS_BRIEFING",
        "NEEDS_PLANNING",
        "READY_FOR_EXECUTION",
        "EXECUTION_IN_PROGRESS",
        "HUMAN_INPUT_REQUIRED",
        "PROJECT_COMPLETE"
      ]
    },
    "system_signal": {
      "type": ["string", "null"]
    },
    "project_manifest": {
      "type": "object",
      "properties": {
        "epics": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["epic_id", "title", "status", "stories"],
            "properties": {
              "epic_id": { "type": "string" },
              "title": { "type": "string" },
              "status": { "type": "string", "enum": ["PENDING", "IN_PROGRESS", "COMPLETE"] },
              "stories": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["story_id", "title", "status"],
                  "properties": {
                    "story_id": { "type": "string" },
                    "title": { "type": "string" },
                    "status": {
                      "type": "string",
                      "enum": ["PENDING", "CODING_IN_PROGRESS", "CODING_COMPLETE", "QA_PASSED", "PO_VERIFIED", "DONE", "FAILED"]
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "history": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["timestamp", "agent_id", "signal", "summary"],
        "properties": {
          "timestamp": { "type": "string", "format": "date-time" },
          "agent_id": { "type": "string" },
          "signal": { "type": ["string", "null"] },
          "summary": { "type": "string" },
          "files_modified": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "issue_log": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["issue_id", "timestamp", "status", "reporter_agent"],
        "properties": {
          "issue_id": { "type": "string" },
          "timestamp": { "type": "string", "format": "date-time" },
          "status": { "type": "string", "enum": ["OPEN", "RESOLVED", "CLOSED"] },
          "reporter_agent": { "type": "string" },
          "story_id": { "type": "string" },
          "summary": { "type": "string" },
          "details": { "type": "string" }
        }
      }
    }
  }
}
--- END OF FILE `.pheromind-core/system_docs/04_System_State_Schema.json` ---
