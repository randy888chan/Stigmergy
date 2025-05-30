# BMAD Orchestrator State (Memory-Enhanced)

## Session Metadata
```yaml
session_id: "[auto-generated-uuid]"
created_timestamp: "[ISO-8601-timestamp]"
last_updated: "[ISO-8601-timestamp]"
bmad_version: "v3.0"
user_id: "[user-identifier]"
project_name: "[project-name]"
project_type: "[mvp|feature|brownfield|greenfield]"
session_duration: "[calculated-minutes]"
```

## Project Context Discovery
```yaml
discovery_status:
  completed: [true|false]
  last_run: "[timestamp]"
  confidence: "[0-100]"

project_analysis:
  domain: "[web-app|mobile|api|data-pipeline|etc]"
  technology_stack: ["[primary-tech]", "[secondary-tech]"]
  architecture_style: "[monolith|microservices|serverless|hybrid]"
  team_size_inference: "[1-5|6-10|11+]"
  project_age: "[new|established|legacy]"
  complexity_assessment: "[simple|moderate|complex|enterprise]"

constraints:
  technical: ["[constraint-1]", "[constraint-2]"]
  business: ["[constraint-1]", "[constraint-2]"]
  timeline: "[aggressive|reasonable|flexible]"
  budget: "[startup|corporate|enterprise]"
```

## Active Workflow Context
```yaml
current_state:
  active_persona: "[persona-name]"
  current_phase: "[analyst|requirements|architecture|design|development|testing|deployment]"
  workflow_type: "[new-project-mvp|feature-addition|refactoring|maintenance]"
  last_task: "[task-name]"
  task_status: "[in-progress|completed|blocked|pending]"
  next_suggested: "[recommended-next-action]"

epic_context:
  current_epic: "[epic-name-or-number]"
  epic_status: "[planning|in-progress|testing|complete]"
  epic_progress: "[0-100]%"
  story_context:
    current_story: "[story-id]"
    story_status: "[draft|approved|in-progress|review|done]"
    stories_completed: "[count]"
    stories_remaining: "[count]"
```

## Decision Archaeology
```yaml
major_decisions:
  - decision_id: "[uuid]"
    timestamp: "[ISO-8601]"
    persona: "[decision-maker]"
    decision: "[technology-choice-or-approach]"
    rationale: "[reasoning-behind-decision]"
    alternatives_considered: ["[option-1]", "[option-2]"]
    constraints: ["[constraint-1]", "[constraint-2]"]
    outcome: "[successful|problematic|unknown|pending]"
    confidence_level: "[0-100]"
    reversibility: "[easy|moderate|difficult|irreversible]"
    
pending_decisions:
  - decision_topic: "[topic-requiring-decision]"
    urgency: "[high|medium|low]"
    stakeholders: ["[persona-1]", "[persona-2]"]
    deadline: "[target-date]"
    blocking_items: ["[blocked-task-1]"]
```

## Memory Intelligence State
```yaml
memory_provider: "[openmemory-mcp|file-based|unavailable]"
memory_status: "[connected|degraded|offline]"
last_memory_sync: "[timestamp]"

pattern_recognition:
  workflow_patterns:
    - pattern_name: "[successful-mvp-pattern]"
      confidence: "[0-100]"
      usage_frequency: "[count]"
      success_rate: "[0-100]%"
  
  decision_patterns:
    - pattern_type: "[architecture|tech-stack|process]"
      pattern_description: "[pattern-summary]"
      effectiveness_score: "[0-100]"
  
  anti_patterns_detected:
    - pattern_name: "[anti-pattern-name]"
      frequency: "[count]"
      severity: "[critical|high|medium|low]"
      last_occurrence: "[timestamp]"

proactive_intelligence:
  insights_generated: "[count]"
  recommendations_active: "[count]"
  warnings_issued: "[count]"
  optimization_opportunities: "[count]"
  
user_preferences:
  communication_style: "[detailed|concise|interactive]"
  workflow_style: "[systematic|agile|exploratory]"
  documentation_preference: "[comprehensive|minimal|visual]"
  feedback_style: "[direct|collaborative|supportive]"
  confidence: "[0-100]%"
```

## Quality Framework Integration
```yaml
quality_status:
  quality_gates_active: [true|false]
  current_gate: "[pre-dev|implementation|completion|none]"
  gate_status: "[passed|pending|failed]"
  
udtm_analysis:
  required_for_current_task: [true|false]
  last_completed: "[timestamp|none]"
  completion_status: "[completed|in-progress|pending|not-required]"
  confidence_achieved: "[0-100]%"

brotherhood_reviews:
  pending_reviews: "[count]"
  completed_reviews: "[count]"
  review_effectiveness: "[0-100]%"
  
anti_pattern_monitoring:
  scanning_active: [true|false]
  violations_detected: "[count]"
  last_scan: "[timestamp]"
  critical_violations: "[count]"
```

## System Health Monitoring
```yaml
system_health:
  overall_status: "[healthy|degraded|critical]"
  last_diagnostic: "[timestamp]"
  
configuration_health:
  config_file_status: "[valid|invalid|missing]"
  persona_files_status: "[all-present|some-missing|critical-missing]"
  task_files_status: "[complete|partial|insufficient]"
  
performance_metrics:
  average_response_time: "[milliseconds]"
  memory_usage: "[percentage]"
  cache_hit_rate: "[percentage]"
  error_frequency: "[count-per-hour]"

resource_status:
  available_personas: "[count]"
  available_tasks: "[count]"
  missing_resources: ["[resource-1]", "[resource-2]"]
```

## Consultation & Collaboration
```yaml
consultation_history:
  - consultation_id: "[uuid]"
    timestamp: "[ISO-8601]"
    type: "[design-review|technical-feasibility|emergency]"
    participants: ["[persona-1]", "[persona-2]"]
    duration: "[minutes]"
    outcome: "[consensus|split-decision|deferred]"
    effectiveness_score: "[0-100]"
    
active_consultations:
  - consultation_type: "[type]"
    status: "[scheduled|in-progress|completed]"
    participants: ["[persona-list]"]
    
collaboration_patterns:
  most_effective_pairs: ["[persona-1+persona-2]"]
  consultation_success_rate: "[0-100]%"
  average_resolution_time: "[minutes]"
```

## Session Continuity Data
```yaml
handoff_context:
  last_handoff_from: "[source-persona]"
  last_handoff_to: "[target-persona]"
  handoff_timestamp: "[timestamp]"
  context_preserved: [true|false]
  handoff_effectiveness: "[0-100]%"

workflow_intelligence:
  suggested_next_steps: ["[action-1]", "[action-2]"]
  predicted_blockers: ["[potential-issue-1]"]
  optimization_opportunities: ["[efficiency-improvement-1]"]
  estimated_completion: "[timeline-estimate]"

session_variables:
  interaction_mode: "[standard|yolo|consultation|diagnostic]"
  verbosity_level: "[minimal|standard|detailed|comprehensive]"
  auto_save_enabled: [true|false]
  memory_enhancement_active: [true|false]
  quality_enforcement_active: [true|false]
```

## Recent Activity Log
```yaml
command_history:
  - timestamp: "[ISO-8601]"
    command: "[command-executed]"
    persona: "[executing-persona]"
    status: "[success|failure|partial]"
    duration: "[seconds]"
    output_summary: "[brief-description]"

insight_generation:
  - timestamp: "[ISO-8601]"
    insight_type: "[pattern|warning|optimization|prediction]"
    insight: "[generated-insight-text]"
    confidence: "[0-100]%"
    applied: [true|false]
    effectiveness: "[0-100]%"

error_log_summary:
  recent_errors: "[count]"
  critical_errors: "[count]"
  last_error: "[timestamp]"
  recovery_success_rate: "[0-100]%"
```

## Bootstrap Analysis Results
```yaml
bootstrap_status:
  completed: [true|false|partial]
  last_run: "[timestamp]"
  analysis_confidence: "[0-100]%"
  
project_archaeology:
  decisions_extracted: "[count]"
  patterns_identified: "[count]"
  preferences_inferred: "[count]"
  technical_debt_assessed: [true|false]
  
discovered_patterns:
  successful_approaches: ["[approach-1]", "[approach-2]"]
  anti_patterns_found: ["[anti-pattern-1]"]
  optimization_opportunities: ["[opportunity-1]"]
  risk_factors: ["[risk-1]", "[risk-2]"]
```

---
**Auto-Generated**: This state is automatically maintained by the BMAD Memory System
**Last Memory Sync**: [timestamp]
**Next Diagnostic**: [scheduled-time]
**Context Restoration Ready**: [true|false] 