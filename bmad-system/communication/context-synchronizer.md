# Context Synchronizer

## Real-time Context Sharing for Claude Code Integration

The Context Synchronizer maintains shared awareness across all BMAD personas within Claude Code, ensuring consistent understanding of project state, decisions, and development progress.

### Context Structure for Claude Code

#### Comprehensive Project Context
```yaml
project_context:
  metadata:
    project_id: "{uuid}"
    project_name: "{descriptive-name}"
    project_type: "web-app|api-service|mobile-app|library|cli-tool"
    tech_stack: ["typescript", "react", "nodejs", "mongodb"]
    phase: "discovery|design|implementation|testing|deployment"
    created_timestamp: "{iso-8601}"
    last_updated: "{iso-8601}"
    
  claude_code_state:
    active_session: "{session-id}"
    workspace_path: "{absolute-path}"
    open_files: ["{file-paths}"]
    recent_tools_used: [
      {
        "tool": "Read",
        "target": "src/components/Auth.tsx",
        "timestamp": "{iso-8601}"
      }
    ]
    current_todos: [
      {
        "id": "todo-123",
        "content": "Implement user authentication",
        "status": "in_progress",
        "assigned_persona": "security"
      }
    ]
    git_context:
      current_branch: "feature/auth-implementation"
      uncommitted_changes: ["src/auth/", "tests/auth/"]
      last_commit: "abc123: Add user login component"
    
  decisions:
    - id: "{uuid}"
      timestamp: "{iso-8601}"
      decision: "Use JWT for authentication"
      made_by: "security"
      rationale: "Stateless, scalable, industry standard"
      impact: ["api-design", "frontend-auth", "security-model"]
      supporting_personas: ["architect", "dev"]
      
  artifacts:
    - id: "{uuid}"
      type: "architecture-document"
      path: "docs/system-architecture.md"
      version: "v1.2"
      last_modified_by: "architect"
      last_modified: "{iso-8601}"
      status: "approved"
      reviewers: ["security", "qa", "pm"]
      
  active_tasks:
    - id: "{uuid}"
      description: "Implement OAuth2 integration"
      assigned_to: ["security", "dev"]
      status: "in_progress"
      dependencies: ["user-model-design"]
      estimated_effort: "8 hours"
      actual_effort: "6 hours"
      blockers: []
      
  knowledge_state:
    learned_patterns: [
      {
        "pattern": "secure-api-authentication",
        "confidence": 0.95,
        "applications": 3,
        "success_rate": 1.0
      }
    ]
    avoided_anti_patterns: [
      {
        "anti_pattern": "password-in-url",
        "prevention_count": 2,
        "last_prevented": "{iso-8601}"
      }
    ]
```

### Context Synchronization Protocol

#### Real-time Context Updates
```python
async def synchronize_context_with_claude_code():
    """
    Maintain real-time synchronization between BMAD context and Claude Code state
    """
    # Monitor Claude Code tool usage
    tool_monitor = await start_tool_usage_monitor()
    
    # Monitor file system changes
    file_monitor = await start_file_system_monitor()
    
    # Monitor git state changes
    git_monitor = await start_git_state_monitor()
    
    # Monitor todo list changes
    todo_monitor = await start_todo_monitor()
    
    async def update_context_from_claude_code():
        while True:
            # Detect Claude Code state changes
            state_changes = await detect_claude_code_changes([
                tool_monitor,
                file_monitor, 
                git_monitor,
                todo_monitor
            ])
            
            if state_changes:
                # Update global context
                updated_context = await update_global_context(state_changes)
                
                # Broadcast updates to all personas
                await broadcast_context_update(updated_context, state_changes)
                
                # Store context snapshot for recovery
                await store_context_snapshot(updated_context)
            
            await asyncio.sleep(0.1)  # 100ms polling interval
    
    # Start continuous synchronization
    await update_context_from_claude_code()

async def sync_decision_with_context(decision_data):
    """
    Synchronize persona decisions with global context
    """
    # Validate decision against current context
    validation_result = await validate_decision_against_context(
        decision_data,
        get_current_context()
    )
    
    if validation_result.conflicts:
        # Handle decision conflicts
        conflict_resolution = await resolve_decision_conflicts(
            decision_data,
            validation_result.conflicts
        )
        
        if conflict_resolution.requires_consultation:
            # Escalate to multi-persona consultation
            consultation_result = await initiate_consultation(
                conflict_resolution.stakeholders,
                decision_data
            )
            decision_data = consultation_result.resolved_decision
    
    # Update global context with validated decision
    updated_context = await add_decision_to_context(decision_data)
    
    # Notify affected personas
    affected_personas = identify_affected_personas(decision_data)
    await notify_personas_of_decision(affected_personas, decision_data)
    
    # Update Claude Code todos if decision creates new tasks
    if decision_data.creates_tasks:
        await update_claude_todos_from_decision(decision_data)
    
    return updated_context
```

#### Context Conflict Resolution
```yaml
conflict_resolution:
  decision_conflicts:
    detection:
      - contradictory_decisions: "Two personas make opposing choices"
      - constraint_violations: "Decision violates established constraints"
      - dependency_conflicts: "Decision affects dependent components"
      
    resolution_strategies:
      - expertise_hierarchy: "Defer to domain expert"
      - stakeholder_consultation: "Get input from affected parties"
      - evidence_based_resolution: "Use data to resolve conflict"
      - compromise_solution: "Find middle ground approach"
      
  resource_conflicts:
    detection:
      - concurrent_file_edits: "Multiple personas editing same file"
      - tool_usage_conflicts: "Competing tool access needs"
      - timeline_conflicts: "Overlapping delivery schedules"
      
    resolution_mechanisms:
      - priority_based_scheduling: "High priority work gets precedence"
      - collaborative_editing: "Coordinate simultaneous work"
      - resource_pooling: "Share resources effectively"
      - sequential_processing: "Order conflicting operations"
```

### Context-Aware Tool Enhancement

#### Smart Tool Selection Based on Context
```python
async def enhance_claude_tools_with_context(tool_request, current_context):
    """
    Enhance Claude Code tool usage with BMAD context awareness
    """
    enhanced_request = {
        'original_request': tool_request,
        'context_enhancement': {},
        'recommendations': []
    }
    
    # Enhance Read operations with context
    if tool_request.tool == 'Read':
        file_context = await get_file_context(
            tool_request.target_file,
            current_context
        )
        
        enhanced_request['context_enhancement'] = {
            'file_history': file_context.modification_history,
            'related_decisions': file_context.related_decisions,
            'persona_annotations': file_context.persona_comments,
            'known_patterns': file_context.identified_patterns
        }
        
        enhanced_request['recommendations'] = [
            f"File last modified by {file_context.last_modifier}",
            f"Related to decisions: {file_context.related_decisions}",
            f"Known patterns: {file_context.identified_patterns}"
        ]
    
    # Enhance Write operations with context
    elif tool_request.tool == 'Write':
        write_context = await get_write_context(
            tool_request.target_file,
            current_context
        )
        
        enhanced_request['context_enhancement'] = {
            'affected_components': write_context.impact_analysis,
            'required_approvals': write_context.approval_requirements,
            'testing_implications': write_context.testing_needs,
            'documentation_updates': write_context.doc_updates_needed
        }
        
        # Automatically create todos for related tasks
        if write_context.creates_follow_up_tasks:
            follow_up_todos = await create_follow_up_todos(write_context)
            enhanced_request['auto_generated_todos'] = follow_up_todos
    
    # Enhance Grep operations with pattern intelligence
    elif tool_request.tool == 'Grep':
        pattern_context = await get_pattern_context(
            tool_request.search_pattern,
            current_context
        )
        
        enhanced_request['context_enhancement'] = {
            'related_patterns': pattern_context.similar_patterns,
            'anti_patterns': pattern_context.anti_patterns_to_avoid,
            'suggested_refinements': pattern_context.search_improvements
        }
    
    return enhanced_request

async def execute_context_aware_tool_operation(enhanced_request):
    """
    Execute tool operations with full context awareness
    """
    # Pre-execution context validation
    validation = await validate_operation_against_context(enhanced_request)
    
    if not validation.is_safe:
        return {
            'status': 'blocked',
            'reason': validation.blocking_issues,
            'suggestions': validation.alternative_approaches
        }
    
    # Execute with context monitoring
    execution_result = await execute_with_monitoring(enhanced_request)
    
    # Post-execution context update
    context_updates = await analyze_execution_impact(
        enhanced_request,
        execution_result
    )
    
    # Update global context
    await update_context_with_execution_results(context_updates)
    
    # Generate insights for future operations
    insights = await extract_insights_from_execution(
        enhanced_request,
        execution_result,
        context_updates
    )
    
    return {
        'execution_result': execution_result,
        'context_updates': context_updates,
        'learned_insights': insights,
        'status': 'completed'
    }
```

### Context Persistence and Recovery

#### Context State Management
```yaml
persistence_strategy:
  real_time_snapshots:
    frequency: "every_significant_change"
    triggers:
      - decision_made: "New decision recorded"
      - artifact_updated: "File modified or created"
      - task_status_change: "Todo status updated"
      - tool_usage: "Significant Claude Code tool operation"
      
  recovery_mechanisms:
    context_corruption:
      - rollback_to_snapshot: "Restore last known good state"
      - partial_reconstruction: "Rebuild from available data"
      - guided_recovery: "Ask user to confirm reconstructed state"
      
    session_interruption:
      - auto_save_state: "Continuous state preservation"
      - session_restoration: "Resume exactly where left off"
      - context_continuity: "Maintain persona awareness across sessions"
```

#### Cross-Session Context Continuity
```python
async def restore_context_across_sessions(project_path):
    """
    Restore full context when returning to a project
    """
    # Load persisted context
    stored_context = await load_stored_context(project_path)
    
    # Analyze current state vs stored state
    current_state = await analyze_current_project_state(project_path)
    state_diff = await compare_states(stored_context, current_state)
    
    if state_diff.has_changes:
        # Context reconstruction needed
        reconstruction_plan = await create_reconstruction_plan(state_diff)
        
        # Apply automatic updates
        auto_updates = await apply_automatic_updates(reconstruction_plan)
        
        # Identify items needing manual review
        manual_review_items = reconstruction_plan.manual_review_needed
        
        if manual_review_items:
            # Present changes to user for confirmation
            user_confirmations = await request_user_confirmations(
                manual_review_items
            )
            await apply_user_confirmations(user_confirmations)
    
    # Restore persona states
    await restore_persona_states(stored_context.persona_states)
    
    # Re-establish tool monitoring
    await restart_context_synchronization()
    
    return {
        'context_restored': True,
        'automatic_updates': auto_updates,
        'manual_confirmations': len(manual_review_items) if manual_review_items else 0,
        'session_continuity': 'established'
    }
```

### Context-Driven Recommendations

#### Intelligent Suggestions Based on Context
```python
async def generate_context_driven_recommendations():
    """
    Generate intelligent recommendations based on current project context
    """
    current_context = await get_current_context()
    
    recommendations = {
        'immediate_actions': [],
        'optimization_opportunities': [],
        'risk_mitigations': [],
        'learning_applications': []
    }
    
    # Analyze for immediate action opportunities
    if current_context.has_pending_decisions:
        for decision in current_context.pending_decisions:
            recommendation = await generate_decision_recommendation(decision)
            recommendations['immediate_actions'].append(recommendation)
    
    # Identify optimization opportunities
    optimization_analysis = await analyze_optimization_opportunities(current_context)
    recommendations['optimization_opportunities'] = optimization_analysis
    
    # Assess risks and suggest mitigations
    risk_analysis = await assess_context_risks(current_context)
    recommendations['risk_mitigations'] = generate_risk_mitigations(risk_analysis)
    
    # Suggest applying learned patterns
    applicable_learning = await identify_applicable_learning(current_context)
    recommendations['learning_applications'] = applicable_learning
    
    return recommendations
```

### Claude Code Integration Commands

```bash
# Context management commands
bmad context status --detailed
bmad context sync --force
bmad context restore --from-snapshot "2024-01-15T10:30:00Z"

# Context-aware operations
bmad context analyze --risks --opportunities
bmad context recommend --based-on "current-state"
bmad context validate --against-decisions

# Context sharing and collaboration
bmad context share --with-persona "architect" --scope "security-decisions"
bmad context merge --from-session "uuid" --resolve-conflicts
bmad context broadcast --update "new-security-requirements"
```

This Context Synchronizer transforms Claude Code into a context-aware development environment where every action is informed by the full project context, enabling more intelligent decision-making and seamless collaboration between AI personas.