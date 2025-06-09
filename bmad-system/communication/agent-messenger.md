# Agent Messenger Protocol

## Inter-Persona Communication System for Claude Code Integration

The Agent Messenger enables seamless communication between BMAD personas when working within Claude Code, allowing for collaborative problem-solving and knowledge sharing.

### Message Format Specification

#### Standard Message Structure
```yaml
message:
  header:
    id: "{uuid}"
    timestamp: "{iso-8601}"
    sender: "{persona-name}"
    recipients: ["{persona-names}"]
    type: "consultation|broadcast|response|escalation"
    priority: "critical|high|normal|low"
    
  context:
    project_phase: "{discovery|design|implementation|testing|deployment}"
    task_id: "{task-identifier}"
    related_artifacts: ["{file-paths}"]
    claude_code_session: "{session-context}"
    
  body:
    subject: "{message-subject}"
    content: "{message-content}"
    required_expertise: ["{expertise-areas}"]
    response_deadline: "{iso-8601}"
    claude_tools_used: ["{tool-names}"]
    
  metadata:
    thread_id: "{conversation-thread}"
    parent_message: "{parent-id}"
    tags: ["{relevant-tags}"]
    claude_code_context: "{current-workspace}"
```

### Communication Patterns for Claude Code

#### 1. Multi-Tool Consultation Pattern
```python
async def consult_multiple_personas_with_tools(problem_context):
    """
    Consult multiple personas using Claude Code tools for comprehensive analysis
    """
    # Architect consultation using code analysis tools
    architect_consultation = {
        'message_type': 'consultation',
        'sender': 'orchestrator',
        'recipient': 'architect',
        'context': problem_context,
        'request': {
            'analyze_files': await glob_pattern_files("**/*.{ts,tsx}"),
            'assess_architecture': await read_architecture_files(),
            'recommend_patterns': 'based_on_codebase_analysis'
        }
    }
    
    # Security consultation using security scanning tools
    security_consultation = {
        'message_type': 'consultation', 
        'sender': 'orchestrator',
        'recipient': 'security',
        'context': problem_context,
        'request': {
            'scan_vulnerabilities': await grep_security_patterns(),
            'assess_dependencies': await analyze_package_json(),
            'recommend_fixes': 'prioritized_by_risk'
        }
    }
    
    # QA consultation using testing tools
    qa_consultation = {
        'message_type': 'consultation',
        'sender': 'orchestrator', 
        'recipient': 'qa',
        'context': problem_context,
        'request': {
            'analyze_test_coverage': await run_coverage_report(),
            'identify_test_gaps': await analyze_test_files(),
            'recommend_testing': 'comprehensive_strategy'
        }
    }
    
    # Send consultations in parallel using Claude Code's concurrent capabilities
    responses = await asyncio.gather(
        send_persona_consultation(architect_consultation),
        send_persona_consultation(security_consultation),
        send_persona_consultation(qa_consultation)
    )
    
    # Synthesize responses for unified recommendation
    unified_response = synthesize_persona_responses(responses)
    
    return unified_response

async def collaborative_code_review(file_paths):
    """
    Coordinate multi-persona code review using Claude Code tools
    """
    # Read files for analysis
    file_contents = await asyncio.gather(*[
        claude_code_read(file_path) for file_path in file_paths
    ])
    
    # Create collaboration workspace
    collaboration_session = {
        'session_id': generate_uuid(),
        'participants': ['architect', 'security', 'qa', 'dev'],
        'files_under_review': file_paths,
        'review_criteria': ['architecture', 'security', 'quality', 'performance']
    }
    
    # Coordinate parallel review by each persona
    review_requests = []
    for persona in collaboration_session['participants']:
        review_request = create_review_request(
            persona, 
            file_contents, 
            collaboration_session
        )
        review_requests.append(review_request)
    
    # Execute reviews in parallel
    review_responses = await asyncio.gather(*[
        execute_persona_review(request) for request in review_requests
    ])
    
    # Consolidate reviews and identify consensus/conflicts
    consolidated_review = consolidate_review_feedback(
        review_responses,
        collaboration_session
    )
    
    # Generate unified review report using Write tool
    await write_review_report(consolidated_review, file_paths)
    
    return consolidated_review
```

#### 2. Progressive Problem-Solving Pattern
```python
async def progressive_problem_solving(initial_problem):
    """
    Solve complex problems through progressive persona engagement
    """
    solution_context = {
        'problem': initial_problem,
        'current_phase': 'analysis',
        'accumulated_insights': [],
        'next_steps': []
    }
    
    # Phase 1: Analyst examines the problem
    analyst_insights = await engage_persona('analyst', {
        'task': 'problem_analysis',
        'context': solution_context,
        'tools_available': ['WebSearch', 'Read', 'Task'],
        'deliverable': 'comprehensive_problem_breakdown'
    })
    
    solution_context['accumulated_insights'].append(analyst_insights)
    solution_context['current_phase'] = 'design'
    
    # Phase 2: Architect designs solution based on analysis
    architect_design = await engage_persona('architect', {
        'task': 'solution_design',
        'context': solution_context,
        'previous_insights': analyst_insights,
        'tools_available': ['Write', 'Edit', 'MultiEdit'],
        'deliverable': 'technical_architecture'
    })
    
    solution_context['accumulated_insights'].append(architect_design)
    solution_context['current_phase'] = 'validation'
    
    # Phase 3: Security validates the design
    security_validation = await engage_persona('security', {
        'task': 'security_validation',
        'context': solution_context,
        'previous_insights': [analyst_insights, architect_design],
        'tools_available': ['Grep', 'Bash', 'WebFetch'],
        'deliverable': 'security_assessment'
    })
    
    solution_context['accumulated_insights'].append(security_validation)
    solution_context['current_phase'] = 'implementation'
    
    # Phase 4: Developer implements with QA oversight
    implementation_plan = await collaborative_implementation(
        solution_context,
        ['dev', 'qa']
    )
    
    return {
        'solution_path': solution_context,
        'final_implementation': implementation_plan,
        'quality_assurance': 'multi_persona_validated'
    }
```

### Message Priority and Routing

#### Intelligent Message Routing
```yaml
routing_strategy:
  priority_based_routing:
    critical_messages:
      - immediate_delivery: "Interrupt current task"
      - all_hands_notification: "Alert all relevant personas"
      - escalation_chain: "Notify management personas"
      
    high_priority:
      - fast_track_processing: "Priority queue handling"
      - relevant_persona_notification: "Alert specific experts"
      - context_preservation: "Maintain full context"
      
    normal_priority:
      - standard_processing: "Regular queue handling"
      - context_aware_delivery: "Deliver when persona available"
      - batch_similar_messages: "Group related communications"
      
  expertise_based_routing:
    automatic_routing:
      - security_questions: "Route to security persona"
      - performance_issues: "Route to architect and qa"
      - user_experience: "Route to design-architect"
      - deployment_problems: "Route to platform-engineer"
      
    multi_expert_consultation:
      - complex_decisions: "Engage multiple relevant experts"
      - conflicting_requirements: "Mediated discussion"
      - innovation_opportunities: "Creative collaboration"
```

### Context-Aware Communication

#### Claude Code Context Integration
```python
async def context_aware_message_handling():
    """
    Handle messages with full awareness of Claude Code context
    """
    # Get current Claude Code workspace context
    current_context = {
        'active_files': await get_currently_open_files(),
        'recent_commands': await get_recent_tool_usage(),
        'project_structure': await analyze_project_structure(),
        'git_status': await get_git_status(),
        'todo_context': await get_current_todos()
    }
    
    # Enhance message routing with context
    def enhance_message_with_context(message):
        message['claude_code_context'] = current_context
        message['relevant_files'] = identify_relevant_files(
            message['content'], 
            current_context['active_files']
        )
        message['suggested_tools'] = suggest_tools_for_message(
            message['content'],
            current_context['recent_commands']
        )
        return message
    
    # Process incoming messages with context awareness
    async def process_contextual_message(message):
        enhanced_message = enhance_message_with_context(message)
        
        # Route to appropriate persona with full context
        persona_response = await route_to_persona(
            enhanced_message['recipient'],
            enhanced_message
        )
        
        # Include context in response for better continuity
        persona_response['context_continuation'] = maintain_context_continuity(
            enhanced_message,
            persona_response
        )
        
        return persona_response
    
    return process_contextual_message
```

### Error Handling and Recovery

#### Robust Communication Patterns
```yaml
error_handling:
  message_delivery_failures:
    retry_mechanisms:
      - exponential_backoff: "Increasing delays between retries"
      - circuit_breaker: "Prevent cascade failures"
      - alternative_routing: "Try different delivery paths"
      
    fallback_strategies:
      - degrade_gracefully: "Provide partial functionality"
      - queue_for_later: "Retry when conditions improve"
      - manual_intervention: "Alert user to communication failure"
      
  persona_unavailability:
    substitution_strategies:
      - similar_expertise: "Route to persona with overlapping skills"
      - collaborative_replacement: "Multiple personas cover missing expert"
      - knowledge_base_lookup: "Provide stored expertise"
      
  context_corruption:
    recovery_mechanisms:
      - context_reconstruction: "Rebuild from available information"
      - partial_context_warning: "Inform about missing information"
      - fresh_context_request: "Ask for context reestablishment"
```

### Integration with Claude Code TodoWrite System

#### Enhanced Todo-Based Coordination
```python
async def coordinate_with_claude_todos(message, todo_context):
    """
    Integrate persona communication with Claude Code's TodoWrite system
    """
    # Analyze message for todo implications
    todo_implications = analyze_message_for_todos(message)
    
    if todo_implications['creates_tasks']:
        # Create todos for identified tasks
        new_todos = []
        for task in todo_implications['tasks']:
            todo_item = {
                'id': generate_uuid(),
                'content': task['description'],
                'status': 'pending',
                'priority': task['priority'],
                'assigned_persona': task['best_suited_persona'],
                'dependencies': task.get('dependencies', []),
                'message_thread': message['thread_id']
            }
            new_todos.append(todo_item)
        
        # Update Claude Code todos
        await claude_code_todo_write(new_todos)
        
        # Notify relevant personas about their assignments
        for todo in new_todos:
            await notify_persona_of_assignment(
                todo['assigned_persona'],
                todo,
                message['thread_id']
            )
    
    if todo_implications['updates_status']:
        # Update existing todo status based on message content
        todo_updates = todo_implications['status_updates']
        await update_todos_from_message(todo_updates, message)
    
    return {
        'todos_created': todo_implications.get('creates_tasks', False),
        'todos_updated': todo_implications.get('updates_status', False),
        'coordination_complete': True
    }
```

### Communication Commands for Claude Code

```bash
# Inter-persona communication commands
bmad message send --to "architect" --subject "API design review" --priority "high"
bmad collaborate --personas "architect,security,qa" --task "feature-implementation"
bmad consult --expert "security" --about "authentication-strategy"

# Communication management
bmad messages list --unread --persona "current"
bmad conversation --thread-id "uuid" --show-history
bmad broadcast --all-personas --message "project-update"

# Context-aware communication
bmad discuss --file "src/api/auth.ts" --with "security,architect"
bmad review --collaborative --files "src/**/*.ts"
bmad handoff --from "design" --to "development" --context "feature-spec"
```

This Agent Messenger system transforms Claude Code into a collaborative environment where multiple AI personas can work together seamlessly, each contributing their specialized expertise while maintaining awareness of the development context and tool usage.