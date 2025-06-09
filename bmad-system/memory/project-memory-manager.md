# Project Memory Manager

## Persistent Project Memory System for Claude Code

The Project Memory Manager provides Claude Code with long-term memory capabilities, enabling it to remember solutions, learn from experiences, and maintain context across sessions.

### Memory Architecture for Claude Code Integration

#### Memory Structure
```yaml
project_memory:
  session_memory:
    current_context:
      - active_decisions: "Decisions made in current session"
      - working_artifacts: "Files being actively worked on"
      - active_personas: "Currently engaged AI personas"
      - current_goals: "Session objectives and priorities"
      - claude_code_state: "Tool usage history and file states"
      
    conversation_history:
      - message_threads: "Inter-persona communications"
      - decision_points: "Critical decision moments"
      - conflict_resolutions: "How conflicts were resolved"
      - claude_commands: "History of Claude Code tool usage"
      
  long_term_memory:
    decisions_made:
      - decision_id: "{uuid}"
        context: "When: project phase, why: rationale, who: decision maker"
        decision_text: "Chosen approach or technology"
        alternatives_considered: ["option1", "option2", "option3"]
        outcome: "Success|Failure|Partial"
        success_metrics: "Quantifiable measures of success"
        lessons_learned: "What we learned from this decision"
        
    solutions_implemented:
      - solution_id: "{uuid}"
        problem: "Detailed problem description"
        context: "Project circumstances when problem occurred"
        approach: "How the problem was solved"
        code_patterns: "Specific code patterns used"
        tools_used: ["Read", "Write", "Edit", "Bash", "Grep"]
        effectiveness: "Success rate and metrics"
        reusability: "How applicable to other situations"
        file_locations: "Where solution was implemented"
        
    errors_encountered:
      - error_id: "{uuid}"
        description: "What went wrong"
        context: "Circumstances leading to error"
        root_cause: "Fundamental cause analysis"
        prevention: "How to avoid in future"
        detection_patterns: "How to recognize early"
        recovery_steps: "How to fix when it happens"
        tools_involved: "Which Claude Code tools were involved"
        
    pattern_library:
      - pattern_id: "{uuid}"
        pattern_name: "Descriptive name"
        pattern_type: "architectural|code|workflow|communication"
        success_contexts: "Where this pattern worked well"
        failure_contexts: "Where this pattern failed"
        adaptation_notes: "How to adapt for different contexts"
        related_patterns: "Complementary or alternative patterns"
```

### Memory Operations for Claude Code

#### Memory Storage with Claude Code Integration
```python
async def store_memory_with_claude_context(memory_item, claude_context):
    """
    Store memory with full Claude Code context integration
    """
    # Enrich memory with Claude Code context
    enriched_memory = {
        **memory_item,
        'claude_code_context': {
            'files_involved': claude_context.get('active_files', []),
            'tools_used': claude_context.get('recent_tools', []),
            'git_state': await get_git_context(),
            'project_structure': await analyze_project_structure(),
            'session_id': claude_context.get('session_id')
        },
        'timestamp': datetime.utcnow().isoformat(),
        'memory_type': classify_memory_type(memory_item)
    }
    
    # Store in structured format for easy retrieval
    memory_storage_path = determine_storage_path(enriched_memory)
    await store_memory_item(enriched_memory, memory_storage_path)
    
    # Create searchable index
    await index_memory_for_search(enriched_memory)
    
    # Link to related memories
    await create_memory_relationships(enriched_memory)
    
    return {
        'memory_id': enriched_memory['id'],
        'storage_path': memory_storage_path,
        'indexed': True,
        'relationships_created': True
    }

async def store_solution_memory(problem, solution, outcome, claude_tools_used):
    """
    Store a successful solution with Claude Code tool context
    """
    solution_memory = {
        'id': generate_uuid(),
        'type': 'solution',
        'problem': {
            'description': problem['description'],
            'context': problem['context'],
            'constraints': problem.get('constraints', []),
            'complexity_level': assess_complexity(problem)
        },
        'solution': {
            'approach': solution['approach'],
            'implementation_steps': solution['steps'],
            'code_changes': solution.get('code_changes', []),
            'configuration_changes': solution.get('config_changes', []),
            'tools_sequence': claude_tools_used
        },
        'outcome': {
            'success_level': outcome['success_level'],
            'metrics': outcome.get('metrics', {}),
            'user_satisfaction': outcome.get('satisfaction'),
            'performance_impact': outcome.get('performance'),
            'maintainability_impact': outcome.get('maintainability')
        },
        'reusability': {
            'applicable_contexts': identify_applicable_contexts(problem, solution),
            'adaptation_guide': create_adaptation_guide(solution),
            'prerequisites': solution.get('prerequisites', []),
            'known_variations': []
        }
    }
    
    # Store with Claude Code context
    current_claude_context = await get_current_claude_context()
    return await store_memory_with_claude_context(
        solution_memory, 
        current_claude_context
    )

async def store_error_memory(error_details, recovery_actions, claude_context):
    """
    Store error experience for future prevention
    """
    error_memory = {
        'id': generate_uuid(),
        'type': 'error',
        'error': {
            'description': error_details['description'],
            'error_type': classify_error_type(error_details),
            'symptoms': error_details['symptoms'],
            'context': error_details['context'],
            'impact': error_details['impact']
        },
        'analysis': {
            'root_cause': error_details['root_cause'],
            'contributing_factors': error_details.get('contributing_factors', []),
            'detection_difficulty': error_details.get('detection_difficulty'),
            'prevention_difficulty': error_details.get('prevention_difficulty')
        },
        'recovery': {
            'steps_taken': recovery_actions['steps'],
            'tools_used': recovery_actions['tools'],
            'time_to_recovery': recovery_actions.get('duration'),
            'effectiveness': recovery_actions['effectiveness']
        },
        'prevention': {
            'early_warning_signs': identify_warning_signs(error_details),
            'prevention_strategies': create_prevention_strategies(error_details),
            'detection_rules': create_detection_rules(error_details),
            'automated_checks': suggest_automated_checks(error_details)
        }
    }
    
    return await store_memory_with_claude_context(error_memory, claude_context)
```

#### Memory Retrieval with Context Awareness
```python
async def retrieve_relevant_memories(current_context, query_type='all'):
    """
    Retrieve memories relevant to current Claude Code context
    """
    # Analyze current context for retrieval cues
    context_cues = extract_context_cues(current_context)
    
    # Search strategies based on context
    search_strategies = {
        'file_based': search_by_file_patterns(context_cues.file_patterns),
        'technology_based': search_by_technology_stack(context_cues.tech_stack),
        'problem_based': search_by_problem_similarity(context_cues.current_problem),
        'tool_based': search_by_tool_usage(context_cues.tools_being_used)
    }
    
    # Execute parallel searches
    search_results = await asyncio.gather(*[
        strategy() for strategy in search_strategies.values()
    ])
    
    # Combine and rank results
    combined_results = combine_search_results(search_results)
    ranked_memories = rank_by_relevance(combined_results, current_context)
    
    # Filter by query type
    if query_type != 'all':
        ranked_memories = filter_by_type(ranked_memories, query_type)
    
    return {
        'relevant_memories': ranked_memories[:10],  # Top 10 most relevant
        'search_metadata': {
            'total_found': len(combined_results),
            'context_cues': context_cues,
            'search_strategies_used': list(search_strategies.keys())
        }
    }

async def get_solution_recommendations(current_problem, claude_context):
    """
    Get solution recommendations based on historical memory
    """
    # Find similar problems from memory
    similar_problems = await search_similar_problems(
        current_problem,
        claude_context
    )
    
    recommendations = []
    for similar_case in similar_problems:
        # Extract applicable solutions
        applicable_solutions = extract_applicable_solutions(
            similar_case,
            current_problem,
            claude_context
        )
        
        for solution in applicable_solutions:
            # Adapt solution to current context
            adapted_solution = await adapt_solution_to_context(
                solution,
                current_problem,
                claude_context
            )
            
            # Calculate confidence score
            confidence = calculate_solution_confidence(
                solution['historical_success'],
                adapted_solution['adaptation_complexity'],
                context_similarity(similar_case['context'], claude_context)
            )
            
            recommendation = {
                'solution': adapted_solution,
                'confidence': confidence,
                'historical_case': similar_case['id'],
                'adaptation_notes': adapted_solution['adaptation_notes'],
                'expected_effort': estimate_implementation_effort(adapted_solution),
                'risk_factors': identify_risk_factors(adapted_solution, current_problem)
            }
            
            recommendations.append(recommendation)
    
    # Sort by confidence and return top recommendations
    return sorted(recommendations, key=lambda x: x['confidence'], reverse=True)[:5]

async def get_error_prevention_guidance(current_activity, claude_context):
    """
    Provide error prevention guidance based on memory
    """
    # Identify potential risks in current activity
    risk_indicators = identify_risk_indicators(current_activity, claude_context)
    
    # Search for similar past errors
    similar_errors = await search_similar_error_contexts(risk_indicators)
    
    prevention_guidance = []
    for error_case in similar_errors:
        # Extract prevention strategies
        prevention_strategies = error_case['prevention']['prevention_strategies']
        
        # Adapt to current context
        adapted_strategies = adapt_prevention_strategies(
            prevention_strategies,
            current_activity,
            claude_context
        )
        
        guidance = {
            'risk_type': error_case['error']['error_type'],
            'warning_signs': error_case['prevention']['early_warning_signs'],
            'prevention_actions': adapted_strategies,
            'detection_rules': error_case['prevention']['detection_rules'],
            'historical_case': error_case['id'],
            'severity': error_case['error']['impact']
        }
        
        prevention_guidance.append(guidance)
    
    return {
        'high_priority_guidance': [g for g in prevention_guidance if g['severity'] == 'high'],
        'medium_priority_guidance': [g for g in prevention_guidance if g['severity'] == 'medium'],
        'all_guidance': prevention_guidance
    }
```

### Memory Lifecycle Management

#### Automatic Memory Capture
```python
async def automatic_memory_capture():
    """
    Automatically capture memory from Claude Code sessions
    """
    # Monitor Claude Code tool usage
    tool_monitor = ToolUsageMonitor()
    
    # Monitor file changes
    file_monitor = FileChangeMonitor()
    
    # Monitor conversation flow
    conversation_monitor = ConversationMonitor()
    
    async def capture_loop():
        while True:
            # Check for significant events
            significant_events = await detect_significant_events([
                tool_monitor,
                file_monitor,
                conversation_monitor
            ])
            
            for event in significant_events:
                if event.type == 'problem_solved':
                    await capture_solution_memory(event)
                elif event.type == 'error_occurred':
                    await capture_error_memory(event)
                elif event.type == 'decision_made':
                    await capture_decision_memory(event)
                elif event.type == 'pattern_discovered':
                    await capture_pattern_memory(event)
            
            await asyncio.sleep(1)  # Check every second
    
    # Start monitoring
    await capture_loop()

async def capture_solution_memory(solution_event):
    """
    Automatically capture solution memory from successful problem resolution
    """
    # Extract problem context
    problem_context = {
        'description': solution_event.problem_description,
        'files_involved': solution_event.files_modified,
        'tools_used': solution_event.claude_tools_sequence,
        'context': solution_event.project_context
    }
    
    # Extract solution details
    solution_details = {
        'approach': solution_event.solution_approach,
        'steps': solution_event.implementation_steps,
        'code_changes': solution_event.code_modifications,
        'validation_steps': solution_event.validation_performed
    }
    
    # Measure outcome
    outcome_metrics = await measure_solution_outcome(solution_event)
    
    # Store solution memory
    return await store_solution_memory(
        problem_context,
        solution_details,
        outcome_metrics,
        solution_event.claude_tools_sequence
    )
```

### Memory-Enhanced Claude Code Commands

#### Intelligent Command Enhancement
```python
async def memory_enhanced_read(file_path, current_context):
    """
    Enhance Read command with memory-based insights
    """
    # Standard read operation
    file_content = await claude_code_read(file_path)
    
    # Get relevant memories about this file
    file_memories = await get_file_related_memories(file_path)
    
    # Generate insights based on memory
    insights = {
        'previous_modifications': extract_modification_patterns(file_memories),
        'common_issues': extract_common_issues(file_memories),
        'successful_patterns': extract_successful_patterns(file_memories),
        'related_decisions': extract_related_decisions(file_memories)
    }
    
    return {
        'content': file_content,
        'memory_insights': insights,
        'recommendations': generate_memory_based_recommendations(
            file_path, 
            file_content, 
            insights,
            current_context
        )
    }

async def memory_enhanced_write(file_path, content, current_context):
    """
    Enhance Write command with memory-based validation
    """
    # Pre-write memory check
    memory_check = await check_write_against_memory(
        file_path,
        content,
        current_context
    )
    
    if memory_check.has_warnings:
        # Present warnings based on memory
        warnings = memory_check.warnings
        user_confirmation = await request_user_confirmation(warnings)
        
        if not user_confirmation:
            return {'status': 'cancelled', 'reason': 'user_cancelled_due_to_warnings'}
    
    # Execute write with memory tracking
    write_result = await claude_code_write(file_path, content)
    
    # Store write action in memory
    await store_write_action_memory(
        file_path,
        content,
        write_result,
        current_context
    )
    
    return write_result

async def memory_enhanced_bash(command, current_context):
    """
    Enhance Bash command with memory-based error prevention
    """
    # Check command against error memory
    error_prevention = await check_command_against_error_memory(
        command,
        current_context
    )
    
    if error_prevention.has_risks:
        # Suggest safer alternatives based on memory
        safer_alternatives = error_prevention.safer_alternatives
        
        enhanced_command = await suggest_command_enhancement(
            command,
            safer_alternatives,
            current_context
        )
        
        if enhanced_command:
            command = enhanced_command
    
    # Execute command with monitoring
    execution_result = await claude_code_bash(command)
    
    # Learn from execution outcome
    await learn_from_command_execution(
        command,
        execution_result,
        current_context
    )
    
    return execution_result
```

### Claude Code Integration Commands

```bash
# Memory management commands
bmad memory search --problem "authentication-issues" --context "nodejs"
bmad memory recall --solution-for "database-connection-pooling"
bmad memory store --solution "api-caching-strategy" --success-metrics "response-time-improved-40%"

# Memory-enhanced development commands
bmad develop --with-memory "implement-feature" --learn-from-similar
bmad analyze --file "src/auth.ts" --show-memory-insights
bmad prevent-errors --activity "database-migration" --based-on-memory

# Memory insights and learning
bmad memory insights --project-patterns
bmad memory learn --from-session --extract-patterns
bmad memory optimize --remove-obsolete --consolidate-similar
```

This Project Memory Manager transforms Claude Code into a learning system that remembers what works, learns from mistakes, and provides increasingly intelligent assistance based on accumulated experience across projects and sessions.