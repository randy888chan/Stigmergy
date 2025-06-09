# Collaboration Orchestrator

## Multi-Agent Task Coordination for Claude Code

The Collaboration Orchestrator enables sophisticated multi-persona workflows within Claude Code, allowing AI experts to work together seamlessly on complex development tasks.

### Collaboration Patterns for Claude Code

#### 1. Sequential Collaboration Pattern
```yaml
sequential_pattern:
  description: "Personas work in sequence, each building on previous work"
  use_cases:
    - feature_development: "Analyst → PM → Architect → Developer → QA"
    - security_review: "Security → Architect → Developer → QA"
    - performance_optimization: "Architect → Developer → QA → Platform Engineer"
  
  coordination_mechanism:
    handoff_protocol:
      - complete_current_work: "Finish assigned tasks"
      - document_deliverables: "Create handoff documentation"
      - notify_next_persona: "Send structured handoff message"
      - validate_prerequisites: "Ensure next persona has what they need"
      
    quality_gates:
      - completion_criteria: "Clear definition of 'done'"
      - validation_checks: "Automated and manual validations"
      - approval_requirements: "Who needs to approve handoff"
      - rollback_procedures: "What to do if issues found"

# Example: Sequential API Development
sequential_api_development:
  phase_1_analysis:
    persona: "analyst"
    deliverables: ["requirements-analysis.md", "user-stories.md"]
    claude_tools: ["WebSearch", "Read", "Write"]
    completion_criteria:
      - all_requirements_documented: true
      - stakeholder_interviews_complete: true
      - acceptance_criteria_defined: true
      
  phase_2_design:
    persona: "architect"
    inputs: ["requirements-analysis.md", "user-stories.md"]
    deliverables: ["api-design.md", "data-model.md", "integration-patterns.md"]
    claude_tools: ["Read", "Write", "Edit", "MultiEdit"]
    completion_criteria:
      - api_endpoints_defined: true
      - data_models_specified: true
      - security_considerations_documented: true
      
  phase_3_security_review:
    persona: "security"
    inputs: ["api-design.md", "data-model.md"]
    deliverables: ["security-assessment.md", "threat-model.md"]
    claude_tools: ["Read", "Grep", "WebFetch", "Write"]
    completion_criteria:
      - threat_model_complete: true
      - security_controls_specified: true
      - compliance_requirements_met: true
```

#### 2. Parallel Collaboration Pattern
```python
async def parallel_collaboration_pattern(task_definition):
    """
    Coordinate multiple personas working simultaneously on related tasks
    """
    # Define parallel work streams
    work_streams = {
        'frontend_development': {
            'persona': 'frontend-dev',
            'tasks': ['component-implementation', 'state-management', 'api-integration'],
            'dependencies': ['api-spec', 'design-mockups'],
            'deliverables': ['ui-components', 'integration-layer']
        },
        'backend_development': {
            'persona': 'backend-dev', 
            'tasks': ['api-implementation', 'database-design', 'business-logic'],
            'dependencies': ['api-spec', 'data-requirements'],
            'deliverables': ['api-endpoints', 'data-access-layer']
        },
        'qa_preparation': {
            'persona': 'qa',
            'tasks': ['test-strategy', 'test-data-preparation', 'automation-setup'],
            'dependencies': ['requirements', 'api-spec'],
            'deliverables': ['test-plans', 'automated-tests']
        },
        'devops_setup': {
            'persona': 'platform-engineer',
            'tasks': ['ci-cd-pipeline', 'infrastructure-setup', 'monitoring'],
            'dependencies': ['deployment-requirements'],
            'deliverables': ['deployment-pipeline', 'infrastructure-code']
        }
    }
    
    # Create shared workspace for coordination
    shared_workspace = await create_shared_workspace(task_definition.project_id)
    
    # Initialize parallel execution
    parallel_tasks = []
    for stream_id, stream_config in work_streams.items():
        task = execute_work_stream(
            stream_id,
            stream_config,
            shared_workspace,
            task_definition.global_context
        )
        parallel_tasks.append(task)
    
    # Monitor parallel execution with coordination
    coordination_result = await coordinate_parallel_execution(
        parallel_tasks,
        shared_workspace
    )
    
    return coordination_result

async def coordinate_parallel_execution(parallel_tasks, shared_workspace):
    """
    Coordinate parallel work streams with conflict resolution and synchronization
    """
    coordination_state = {
        'active_tasks': parallel_tasks,
        'completed_tasks': [],
        'blocked_tasks': [],
        'conflicts': [],
        'shared_resources': shared_workspace.resources
    }
    
    while coordination_state['active_tasks']:
        # Check for task completions
        completed = await check_task_completions(coordination_state['active_tasks'])
        coordination_state['completed_tasks'].extend(completed)
        coordination_state['active_tasks'] = [
            task for task in coordination_state['active_tasks'] 
            if task not in completed
        ]
        
        # Detect and resolve conflicts
        conflicts = await detect_resource_conflicts(coordination_state)
        if conflicts:
            resolution_results = await resolve_conflicts(conflicts, shared_workspace)
            coordination_state['conflicts'].extend(resolution_results)
        
        # Handle blocked tasks
        blocked_tasks = await identify_blocked_tasks(coordination_state['active_tasks'])
        if blocked_tasks:
            unblock_results = await attempt_to_unblock_tasks(
                blocked_tasks, 
                coordination_state
            )
            coordination_state['blocked_tasks'].extend(unblock_results)
        
        # Synchronize shared state
        await synchronize_shared_workspace(shared_workspace, coordination_state)
        
        # Brief pause before next coordination cycle
        await asyncio.sleep(1)
    
    # Final integration of parallel work
    integration_result = await integrate_parallel_outputs(
        coordination_state['completed_tasks'],
        shared_workspace
    )
    
    return {
        'coordination_summary': coordination_state,
        'integration_result': integration_result,
        'final_deliverables': integration_result.consolidated_outputs
    }
```

#### 3. Consultative Collaboration Pattern
```python
async def consultative_collaboration(primary_persona, consultation_needs):
    """
    Enable primary persona to consult with experts as needed
    """
    consultation_session = {
        'session_id': generate_uuid(),
        'primary_persona': primary_persona,
        'consultation_requests': [],
        'expert_responses': [],
        'decisions_made': []
    }
    
    for consultation in consultation_needs:
        # Prepare consultation request
        consultation_request = {
            'id': generate_uuid(),
            'expert_needed': consultation['expert_domain'],
            'question': consultation['question'],
            'context': consultation['context'],
            'urgency': consultation.get('urgency', 'normal'),
            'claude_tools_available': consultation.get('tools', ['Read', 'Write', 'WebFetch'])
        }
        
        # Route to appropriate expert
        expert_persona = select_expert_for_domain(consultation['expert_domain'])
        
        # Execute consultation using Claude Code tools
        expert_response = await execute_expert_consultation(
            expert_persona,
            consultation_request,
            consultation_session
        )
        
        consultation_session['expert_responses'].append(expert_response)
        
        # Apply expert recommendations
        if expert_response.requires_action:
            action_result = await apply_expert_recommendations(
                expert_response,
                primary_persona,
                consultation_session
            )
            consultation_session['decisions_made'].append(action_result)
    
    return consultation_session

async def execute_expert_consultation(expert_persona, consultation_request, session):
    """
    Execute a single expert consultation using Claude Code capabilities
    """
    # Prepare expert context
    expert_context = await prepare_expert_context(
        expert_persona,
        consultation_request,
        session['primary_persona']
    )
    
    # Execute consultation based on domain
    if expert_persona == 'security':
        consultation_result = await security_consultation(
            consultation_request,
            expert_context
        )
    elif expert_persona == 'architect':
        consultation_result = await architecture_consultation(
            consultation_request,
            expert_context
        )
    elif expert_persona == 'qa':
        consultation_result = await quality_consultation(
            consultation_request,
            expert_context
        )
    elif expert_persona == 'platform-engineer':
        consultation_result = await infrastructure_consultation(
            consultation_request,
            expert_context
        )
    
    # Document consultation for future reference
    await document_consultation(
        consultation_request,
        consultation_result,
        session
    )
    
    return consultation_result

# Example: Security Consultation Implementation
async def security_consultation(consultation_request, expert_context):
    """
    Security expert consultation using Claude Code tools
    """
    # Analyze security implications using Grep and Read
    if 'code_review' in consultation_request['context']:
        code_files = consultation_request['context']['files']
        
        # Use Grep to find security-relevant patterns
        security_patterns = await grep_security_patterns(code_files)
        
        # Use Read to analyze specific security concerns
        detailed_analysis = await analyze_security_details(
            code_files,
            security_patterns
        )
        
        # Use WebFetch to check latest security advisories
        latest_threats = await fetch_latest_security_advisories(
            expert_context['technology_stack']
        )
    
    # Generate security recommendations
    recommendations = generate_security_recommendations(
        detailed_analysis,
        latest_threats,
        expert_context
    )
    
    # Create implementation guidance using Write tool
    implementation_guide = await create_security_implementation_guide(
        recommendations,
        consultation_request['context']
    )
    
    return {
        'expert': 'security',
        'analysis': detailed_analysis,
        'recommendations': recommendations,
        'implementation_guide': implementation_guide,
        'risk_assessment': assess_security_risks(detailed_analysis),
        'requires_action': len(recommendations) > 0
    }
```

### Collaboration Workspace Management

#### Shared Workspace for Claude Code
```yaml
shared_workspace:
  workspace_structure:
    shared_files:
      - collaboration_notes.md: "Real-time collaboration notes"
      - decision_log.md: "Decisions made during collaboration"
      - artifact_registry.md: "Registry of all created artifacts"
      - conflict_resolution_log.md: "Record of resolved conflicts"
      
    persona_workspaces:
      - architect/: "Architecture-specific working files"
      - security/: "Security analysis and reports"
      - qa/: "Test plans and quality assessments"
      - dev/: "Implementation artifacts"
      
    integration_area:
      - final_deliverables/: "Consolidated outputs"
      - review_materials/: "Items pending review"
      - approved_artifacts/: "Finalized deliverables"
      
  access_control:
    read_permissions:
      - all_personas: ["shared_files/*", "*/README.md"]
      - persona_specific: ["own_workspace/*"]
      - integration_access: ["integration_area/*"]
      
    write_permissions:
      - collaborative_files: ["collaboration_notes.md", "decision_log.md"]
      - persona_workspaces: ["own_workspace/*"]
      - controlled_integration: ["integration_area/*"] # requires approval
      
  synchronization_rules:
    real_time_sync:
      - collaboration_notes.md: "immediate_sync"
      - decision_log.md: "immediate_sync"
      - conflict_resolution_log.md: "immediate_sync"
      
    batch_sync:
      - persona_workspaces: "every_5_minutes"
      - integration_area: "on_explicit_request"
      
    conflict_resolution:
      - concurrent_edits: "merge_with_annotations"
      - contradictory_decisions: "escalate_to_orchestrator"
      - resource_conflicts: "priority_based_resolution"
```

### Conflict Detection and Resolution

#### Intelligent Conflict Management
```python
async def detect_and_resolve_collaboration_conflicts():
    """
    Continuously monitor for collaboration conflicts and resolve them intelligently
    """
    conflict_monitor = {
        'file_conflicts': await monitor_concurrent_file_edits(),
        'decision_conflicts': await monitor_contradictory_decisions(),
        'resource_conflicts': await monitor_resource_contention(),
        'timeline_conflicts': await monitor_schedule_conflicts()
    }
    
    detected_conflicts = []
    
    # Check each conflict type
    for conflict_type, monitor in conflict_monitor.items():
        conflicts = await monitor.check_for_conflicts()
        if conflicts:
            detected_conflicts.extend([
                {'type': conflict_type, 'details': conflict}
                for conflict in conflicts
            ])
    
    # Resolve conflicts using appropriate strategies
    resolution_results = []
    for conflict in detected_conflicts:
        resolution_strategy = select_resolution_strategy(conflict)
        resolution_result = await execute_resolution_strategy(
            conflict,
            resolution_strategy
        )
        resolution_results.append(resolution_result)
    
    return {
        'conflicts_detected': len(detected_conflicts),
        'conflicts_resolved': len([r for r in resolution_results if r.success]),
        'pending_conflicts': [r for r in resolution_results if not r.success],
        'resolution_summary': resolution_results
    }

async def execute_resolution_strategy(conflict, strategy):
    """
    Execute specific conflict resolution strategy
    """
    if strategy.type == 'expertise_hierarchy':
        # Defer to domain expert
        expert_decision = await consult_domain_expert(conflict, strategy.expert)
        resolution = await apply_expert_decision(expert_decision, conflict)
        
    elif strategy.type == 'collaborative_merge':
        # Merge conflicting work collaboratively
        merge_session = await initiate_collaborative_merge(conflict)
        resolution = await execute_collaborative_merge(merge_session)
        
    elif strategy.type == 'sequential_ordering':
        # Order conflicting operations sequentially
        operation_order = await determine_optimal_sequence(conflict)
        resolution = await execute_sequential_operations(operation_order)
        
    elif strategy.type == 'resource_sharing':
        # Share contested resources
        sharing_plan = await create_resource_sharing_plan(conflict)
        resolution = await implement_resource_sharing(sharing_plan)
    
    # Document resolution for learning
    await document_conflict_resolution(conflict, strategy, resolution)
    
    return resolution
```

### Performance Optimization for Collaboration

#### Efficient Multi-Persona Coordination
```yaml
performance_optimization:
  parallel_processing:
    independent_tasks:
      - identify_dependencies: "Map task interdependencies"
      - create_execution_graph: "Optimize execution order"
      - maximize_parallelism: "Run independent tasks simultaneously"
      
    resource_pooling:
      - shared_tool_access: "Coordinate Claude Code tool usage"
      - memory_sharing: "Share computed results between personas"
      - cache_coordination: "Avoid duplicate computations"
      
  communication_efficiency:
    message_batching:
      - group_related_messages: "Bundle related communications"
      - compress_large_contexts: "Reduce context transfer overhead"
      - prioritize_urgent_communications: "Fast-track critical messages"
      
    smart_routing:
      - direct_expertise_matching: "Route directly to best expert"
      - avoid_unnecessary_routing: "Skip irrelevant personas"
      - predictive_pre-positioning: "Anticipate consultation needs"
      
  context_optimization:
    incremental_updates:
      - delta_synchronization: "Only sync changes, not full context"
      - selective_distribution: "Send relevant context only"
      - lazy_loading: "Load context on demand"
      
    intelligent_caching:
      - context_snapshots: "Cache frequently accessed contexts"
      - prediction_caching: "Pre-cache likely needed contexts"
      - adaptive_expiration: "Intelligent cache invalidation"
```

### Claude Code Integration Commands

```bash
# Collaboration initiation
bmad collaborate start --pattern "sequential" --participants "analyst,architect,dev"
bmad collaborate start --pattern "parallel" --workstreams "frontend,backend,qa"
bmad collaborate start --pattern "consultative" --primary "architect" --experts "security,qa"

# Workspace management
bmad workspace create --shared --participants "architect,security,qa"
bmad workspace sync --resolve-conflicts
bmad workspace status --show-conflicts

# Collaboration monitoring
bmad collaborate status --active-sessions
bmad collaborate conflicts --list --resolve
bmad collaborate handoff --from "architect" --to "dev" --validate

# Performance and optimization
bmad collaborate optimize --parallel-efficiency
bmad collaborate analyze --bottlenecks
bmad collaborate report --session "uuid" --detailed
```

This Collaboration Orchestrator transforms Claude Code into a sophisticated multi-agent workspace where AI personas can work together efficiently, handling complex development tasks that require multiple areas of expertise while maintaining coordination and resolving conflicts intelligently.