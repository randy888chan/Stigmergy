# 📊 Stigmergy System State Schema

## Overall Structure

```json
{
  "project_id": "string",
  "project_name": "string",
  "project_status": "string",
  "current_phase": "string",
  "business_outcomes": {
    "expected_roi": "string",
    "kpis": ["string"]
  },
  "rollback_safety": {
    "is_enabled": "boolean",
    "last_stable_state": "object"
  },
  "ledger": [
    {
      "timestamp": "number",
      "event_type": "string",
      "agent_id": "string",
      "details": "object"
    }
  ],
  "swarm_memory": {
    "task_history": [
      {
        "task_id": "string",
        "agent_id": "string",
        "start_time": "number",
        "end_time": "number",
        "success": "boolean",
        "failure_reason": "string"
      }
    ],
    "agent_performance": {
      "agent_id": {
        "success_rate": "number",
        "avg_completion_time": "number",
        "common_failure_modes": ["string"]
      }
    }
  },
  "current_context": {
    "brainstorming": "object",
    "requirements": "object",
    "architecture": "object",
    "task_breakdown": "object",
    "execution_plan": "object"
  }
}
```

## State Transitions

### Project Status Workflow

```
[INITIALIZING] → [BRAINSTORMING] → [REQUIREMENTS] → [ARCHITECTURE] → [TASK_BREAKDOWN] → [EXECUTION] → [VALIDATION] → [COMPLETED]
       ↑                                                                                      |
       └─────────────────────────────────────────[FAILED] ←───────────────────────────────────┘
```

### Phase-Specific State Schema

#### 1. Brainstorming Phase

```json
{
  "current_phase": "BRAINSTORMING",
  "brainstorming": {
    "project_goal": "string",
    "target_audience": "string",
    "key_stakeholders": ["string"],
    "assumptions": ["string"],
    "constraints": ["string"],
    "business_value": "string"
  }
}
```

#### 2. Requirements Phase

```json
{
  "current_phase": "REQUIREMENTS",
  "requirements": {
    "user_stories": [
      {
        "id": "string",
        "as_a": "string",
        "i_want": "string",
        "so_that": "string",
        "acceptance_criteria": ["string"]
      }
    ],
    "technical_requirements": ["string"],
    "business_requirements": ["string"]
  }
}
```

#### 3. Architecture Phase

```json
{
  "current_phase": "ARCHITECTURE",
  "architecture": {
    "blueprint_id": "string",
    "component_diagram": "string",
    "technology_stack": ["string"],
    "data_flow": "string",
    "security_considerations": ["string"],
    "scalability_plan": "string"
  }
}
```

#### 4. Task Breakdown Phase

```json
{
  "current_phase": "TASK_BREAKDOWN",
  "task_breakdown": {
    "tasks": [
      {
        "id": "string",
        "story_id": "string",
        "description": "string",
        "dependencies": ["string"],
        "estimated_complexity": "number",
        "assigned_agent": "string",
        "verification_criteria": ["string"]
      }
    ]
  }
}
```

#### 5. Execution Phase

```json
{
  "current_phase": "EXECUTION",
  "execution_plan": {
    "task_status": {
      "task_id": {
        "status": "string",
        "started_at": "number",
        "completed_at": "number",
        "output": "string",
        "verification_results": ["object"]
      }
    }
  }
}
```

## Critical State Management Protocols

1. **Immutable Ledger**: All state transitions are recorded in the ledger and cannot be modified
2. **State Verification**: Before transitioning phases, all required outputs must exist and meet quality standards
3. **Context Preservation**: Current context is maintained across state transitions
4. **Error Recovery**: Failed states include detailed error information for recovery
5. **Audit Trail**: All state changes include timestamp, agent ID, and details for auditability
