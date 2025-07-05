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
